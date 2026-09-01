import {
  vslRevealAtSeconds,
  vslRevealPhrases,
  vslRevealStorageKey,
  youtubeId,
} from "./config.ts";

let contentRevealed = false;
let revealThreshold = vslRevealAtSeconds;
let timePollId: number | null = null;

export function isContentRevealed(): boolean {
  return contentRevealed;
}

export function revealPageContent(onRevealed?: () => void): void {
  if (contentRevealed) return;

  contentRevealed = true;
  document.body.classList.add("is-content-revealed");
  sessionStorage.setItem(vslRevealStorageKey, "1");

  const gated = document.getElementById("lp-gated");
  if (gated) gated.removeAttribute("hidden");

  onRevealed?.();
}

export function restoreRevealFromSession(onRevealed?: () => void): void {
  if (sessionStorage.getItem(vslRevealStorageKey) !== "1") return;
  revealPageContent(onRevealed);
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function setRevealThresholdFromDuration(duration: number): void {
  if (!Number.isFinite(duration) || duration <= 0) return;

  // Script time (22:00) may exceed the uploaded cut — clamp to the offer section near the end.
  const nearOfferSection = Math.max(0, duration - 120);
  revealThreshold = Math.min(vslRevealAtSeconds, nearOfferSection);
}

function shouldRevealAtTime(currentTime: number): boolean {
  return Number.isFinite(currentTime) && currentTime >= revealThreshold;
}

function checkRevealTime(player: YT.Player): boolean {
  if (contentRevealed) return true;

  if (shouldRevealAtTime(player.getCurrentTime())) {
    revealPageContent();
    stopRevealWatcher();
    return true;
  }

  return false;
}

function stopRevealWatcher(): void {
  if (timePollId === null) return;
  window.clearInterval(timePollId);
  timePollId = null;
}

function startRevealWatcher(player: YT.Player): void {
  stopRevealWatcher();

  timePollId = window.setInterval(() => {
    checkRevealTime(player);
  }, 250);
}

export function loadYoutubeIframeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }

    let settled = false;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      finish();
    };

    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.append(tag);
    }

    const pollId = window.setInterval(() => {
      if (window.YT?.Player) {
        window.clearInterval(pollId);
        finish();
      }
    }, 50);

    window.setTimeout(() => {
      window.clearInterval(pollId);
      finish();
    }, 15000);
  });
}

function parseCaptionSeconds(xml: string, phrases: readonly string[]): number | null {
  const normalizedPhrases = phrases.map(normalizeText);
  const re = /<text start="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;

  for (const match of xml.matchAll(re)) {
    const start = Number(match[1]);
    const text = normalizeText(
      match[2]
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&"),
    );

    if (normalizedPhrases.some((phrase) => text.includes(phrase))) {
      return Number.isFinite(start) ? start : null;
    }
  }

  return null;
}

async function resolveRevealThresholdFromCaptions(): Promise<void> {
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${youtubeId}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const page = await pageRes.text();
    const match =
      page.match(/"baseUrl":"(https:\\u0026[^"]+timedtext[^"]+)"/) ??
      page.match(/"baseUrl":"(https:\/\/www\.youtube\.com\/api\/timedtext[^"]+)"/);

    if (!match) return;

    const captionUrl = match[1].replace(/\\u0026/g, "&").replace(/\\/g, "");
    const captionRes = await fetch(captionUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const xml = await captionRes.text();
    if (!xml.trim()) return;

    const phraseTime = parseCaptionSeconds(xml, vslRevealPhrases);
    if (phraseTime === null) return;

    revealThreshold = Math.min(revealThreshold, phraseTime);
  } catch {
    // Captions are best-effort; duration fallback still applies.
  }
}

export function initVslReveal(onRevealed?: () => void): void {
  const wrap = document.querySelector<HTMLElement>("[data-vsl-wrap]");
  const shield = document.querySelector<HTMLButtonElement>("[data-vsl-shield]");
  if (!wrap || !shield) return;

  let player: YT.Player | null = null;
  let audioUnmuted = false;

  const setPausedUi = (paused: boolean): void => {
    wrap.classList.toggle("is-paused", paused);
    shield.setAttribute("aria-label", paused ? "Reproduzir vídeo" : "Pausar vídeo");
  };

  const bootPlayer = async (): Promise<void> => {
    await loadYoutubeIframeApi();
    void resolveRevealThresholdFromCaptions();

    player = new YT.Player("youtube-player", {
      videoId: youtubeId,
      playerVars: {
        autoplay: 1,
        mute: 1,
        rel: 0,
        controls: 0,
        modestbranding: 1,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        playsinline: 1,
        cc_load_policy: 1,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (event) => {
          const readyPlayer = event.target;
          setRevealThresholdFromDuration(readyPlayer.getDuration());
          readyPlayer.playVideo();
          setPausedUi(false);
          startRevealWatcher(readyPlayer);
          checkRevealTime(readyPlayer);
        },
        onStateChange: (event) => {
          const activePlayer = event.target;
          const paused =
            event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED;
          setPausedUi(paused);
          checkRevealTime(activePlayer);

          if (
            event.data === YT.PlayerState.PLAYING ||
            event.data === YT.PlayerState.BUFFERING
          ) {
            startRevealWatcher(activePlayer);
          }

          if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
            stopRevealWatcher();
          }
        },
      },
    });
  };

  shield.addEventListener("click", () => {
    if (!player) return;

    if (!audioUnmuted) {
      player.unMute();
      player.setVolume(100);
      audioUnmuted = true;
    }

    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
      player.pauseVideo();
      return;
    }

    player.playVideo();
  });

  void bootPlayer();

  restoreRevealFromSession(onRevealed);
}

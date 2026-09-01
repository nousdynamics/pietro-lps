import {
  vslPhraseCues,
  vslRevealAtSeconds,
  vslRevealPhrases,
  vslRevealStorageKey,
  youtubeId,
} from "./config.ts";

let contentRevealed = false;
let revealPollId: number | null = null;
let onContentRevealedCallback: (() => void) | undefined;

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

  stopRevealWatcher();
  (onRevealed ?? onContentRevealedCallback)?.();
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

const normalizedPhrases = vslRevealPhrases.map(normalizeText);

function phraseMatchesAtPlaybackTime(currentTime: number): boolean {
  for (const cue of vslPhraseCues) {
    const cueEnd = cue.start + cue.dur;
    if (currentTime < cue.start || currentTime > cueEnd) continue;

    const cueText = normalizeText(cue.text);
    if (normalizedPhrases.some((phrase) => cueText.includes(phrase))) {
      return true;
    }
  }

  return false;
}

function shouldRevealAtPlaybackTime(currentTime: number): boolean {
  if (!Number.isFinite(currentTime) || currentTime < 0) return false;

  // getCurrentTime() = posição no vídeo (segundos), não relógio real — funciona com 1x, 2x ou seek.
  return currentTime >= vslRevealAtSeconds || phraseMatchesAtPlaybackTime(currentTime);
}

function checkReveal(player: YT.Player): boolean {
  if (contentRevealed) return true;

  if (shouldRevealAtPlaybackTime(player.getCurrentTime())) {
    revealPageContent();
    return true;
  }

  return false;
}

function stopRevealWatcher(): void {
  if (revealPollId === null) return;
  window.clearInterval(revealPollId);
  revealPollId = null;
}

function startRevealWatcher(player: YT.Player): void {
  if (contentRevealed || revealPollId !== null) return;

  revealPollId = window.setInterval(() => {
    checkReveal(player);
  }, 200);
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

export function initVslReveal(onRevealed?: () => void): void {
  onContentRevealedCallback = onRevealed;

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
          readyPlayer.playVideo();
          setPausedUi(false);
          startRevealWatcher(readyPlayer);
          checkReveal(readyPlayer);
        },
        onStateChange: (event) => {
          const activePlayer = event.target;
          const paused =
            event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED;
          setPausedUi(paused);
          checkReveal(activePlayer);

          if (
            !contentRevealed &&
            (event.data === YT.PlayerState.PLAYING ||
              event.data === YT.PlayerState.BUFFERING ||
              event.data === YT.PlayerState.PAUSED)
          ) {
            startRevealWatcher(activePlayer);
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
    } else {
      player.playVideo();
    }

    checkReveal(player);
  });

  void bootPlayer();
  restoreRevealFromSession(onRevealed);
}

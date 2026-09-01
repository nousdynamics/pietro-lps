import "@fontsource/gloock/latin-400.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/sections.css";

import {
  checkoutUrl,
  vslRevealAtSeconds,
  vslRevealStorageKey,
  youtubeId,
} from "./config.ts";

let contentRevealed = false;
let timePollId: number | null = null;
let vslPlayer: YT.Player | null = null;

function bindCheckoutLinks(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>("[data-checkout]");
  for (const link of links) {
    link.href = checkoutUrl;
  }
}

function revealPageContent(): void {
  if (contentRevealed) return;

  contentRevealed = true;
  document.body.classList.add("is-content-revealed");
  sessionStorage.setItem(vslRevealStorageKey, "1");

  const gated = document.getElementById("lp-gated");
  if (gated) gated.hidden = false;

  initFadeIn(gated ?? undefined);

  const heroExtras = document.querySelectorAll<HTMLElement>(
    ".hero__intro, .hero__benefits, .hero__trust",
  );
  for (const node of heroExtras) {
    node.classList.add("is-visible");
  }
}

function restoreRevealFromSession(): void {
  if (sessionStorage.getItem(vslRevealStorageKey) !== "1") return;
  revealPageContent();
}

function loadYoutubeIframeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };

    if (document.getElementById("youtube-iframe-api")) return;

    const tag = document.createElement("script");
    tag.id = "youtube-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.append(tag);
  });
}

function stopTimePoll(): void {
  if (timePollId === null) return;
  window.clearInterval(timePollId);
  timePollId = null;
}

function startTimePoll(player: YT.Player): void {
  stopTimePoll();

  timePollId = window.setInterval(() => {
    if (player.getCurrentTime() >= vslRevealAtSeconds) {
      revealPageContent();
      stopTimePoll();
    }
  }, 400);
}

function handlePlayerStateChange(player: YT.Player, state: YT.PlayerState): void {
  if (player.getCurrentTime() >= vslRevealAtSeconds) {
    revealPageContent();
    stopTimePoll();
  }

  if (state === YT.PlayerState.PLAYING) {
    startTimePoll(player);
    return;
  }

  if (
    state === YT.PlayerState.PAUSED ||
    state === YT.PlayerState.ENDED ||
    state === YT.PlayerState.BUFFERING
  ) {
    stopTimePoll();
  }
}

function setVslPausedUi(wrap: HTMLElement, shield: HTMLButtonElement, paused: boolean): void {
  wrap.classList.toggle("is-paused", paused);
  shield.setAttribute("aria-label", paused ? "Reproduzir vídeo" : "Pausar vídeo");
}

function initVslPlayer(): void {
  const wrap = document.querySelector<HTMLElement>("[data-vsl-wrap]");
  const shield = document.querySelector<HTMLButtonElement>("[data-vsl-shield]");
  if (!wrap || !shield) return;

  let audioUnmuted = false;

  const bootPlayer = async (): Promise<void> => {
    await loadYoutubeIframeApi();

    vslPlayer = new YT.Player("youtube-player", {
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
        cc_load_policy: 0,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (event) => {
          event.target.playVideo();
          setVslPausedUi(wrap, shield, false);
        },
        onStateChange: (event) => {
          const paused =
            event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED;
          setVslPausedUi(wrap, shield, paused);
          handlePlayerStateChange(event.target, event.data);
        },
      },
    });
  };

  shield.addEventListener("click", () => {
    if (!vslPlayer) return;

    if (!audioUnmuted) {
      vslPlayer.unMute();
      vslPlayer.setVolume(100);
      audioUnmuted = true;
    }

    const state = vslPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
      vslPlayer.pauseVideo();
      return;
    }

    vslPlayer.playVideo();
  });

  void bootPlayer();
}

function initFadeIn(scope?: ParentNode): void {
  const nodes = scope
    ? scope.querySelectorAll<HTMLElement>(".fade-in")
    : document.querySelectorAll<HTMLElement>(".fade-in");

  if (!nodes.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (const node of nodes) node.classList.add("is-visible");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );

  for (const node of nodes) observer.observe(node);
}

function initFaqA11y(): void {
  const items = document.querySelectorAll<HTMLDetailsElement>(".faq__item");
  for (const item of items) {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      for (const other of items) {
        if (other !== item) other.open = false;
      }
    });
  }
}

bindCheckoutLinks();
restoreRevealFromSession();
initVslPlayer();
initFadeIn(document.querySelector(".hero") ?? undefined);
initFaqA11y();

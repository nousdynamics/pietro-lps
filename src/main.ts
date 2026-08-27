import "@fontsource/gloock/latin-400.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/sections.css";

import { checkoutUrl, youtubeId } from "./config.ts";

function bindCheckoutLinks(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>("[data-checkout]");
  for (const link of links) {
    link.href = checkoutUrl;
  }
}

function initYoutubeFacade(): void {
  const facade = document.querySelector<HTMLButtonElement>("[data-youtube-facade]");
  if (!facade) return;

  const loadPlayer = (): void => {
    const wrap = facade.parentElement;
    if (!wrap) return;

    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`;
    iframe.title = "VSL Criador Consciente";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.loading = "eager";

    wrap.replaceChildren(iframe);
  };

  facade.addEventListener("click", loadPlayer, { once: true });
  facade.addEventListener(
    "keydown",
    (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        loadPlayer();
      }
    },
    { once: true },
  );
}

function initFadeIn(): void {
  const nodes = document.querySelectorAll<HTMLElement>(".fade-in");
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
initYoutubeFacade();
initFadeIn();
initFaqA11y();

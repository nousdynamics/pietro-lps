import "@fontsource/gloock/latin-400.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/sections.css";

import { checkoutUrl } from "./config.ts";
import { initHeroBackground } from "./hero-background.ts";
import { initVslReveal } from "./vsl-reveal.ts";

function bindCheckoutLinks(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>("[data-checkout]");
  for (const link of links) {
    link.href = checkoutUrl;
  }
}

function isMobileViewport(): boolean {
  return window.matchMedia("(max-width: 640px)").matches;
}

function isMobileGatedHidden(node: HTMLElement): boolean {
  if (!isMobileViewport()) return false;
  if (document.body.classList.contains("is-content-revealed")) return false;
  return Boolean(node.closest(".is-mobile-gated"));
}

function markFadeInsVisible(scope?: ParentNode): void {
  if (!scope) return;

  for (const node of scope.querySelectorAll<HTMLElement>(".fade-in")) {
    node.classList.add("is-visible");
  }
}

function initFadeIn(scope?: ParentNode, skipGated = false): void {
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

  for (const node of nodes) {
    if (skipGated && isMobileGatedHidden(node)) continue;
    if (node.classList.contains("is-visible")) continue;
    observer.observe(node);
  }
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

function onContentRevealed(): void {
  const gated = document.getElementById("lp-gated");
  const heroPitch = document.getElementById("hero-pitch-gated");
  const heroTrust = document.getElementById("hero-trust-gated");
  const heroCta = document.getElementById("hero-cta-gated");

  markFadeInsVisible(gated ?? undefined);
  markFadeInsVisible(heroPitch ?? undefined);
  markFadeInsVisible(heroTrust ?? undefined);
  markFadeInsVisible(heroCta ?? undefined);

  initFadeIn(gated ?? undefined);
  initFadeIn(heroPitch ?? undefined);
  initFadeIn(heroTrust ?? undefined);
  initFadeIn(heroCta ?? undefined);
}

bindCheckoutLinks();
initHeroBackground();
initVslReveal(onContentRevealed);
initFadeIn(document.querySelector(".hero") ?? undefined, true);
initFaqA11y();

// Ensure gated fade-ins appear if session already unlocked before observer ran.
if (document.body.classList.contains("is-content-revealed")) {
  onContentRevealed();
}

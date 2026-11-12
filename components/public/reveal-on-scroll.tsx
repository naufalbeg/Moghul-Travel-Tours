"use client";

import { useEffect } from "react";

/**
 * Blocks marked `reveal` ease in once as they are scrolled to (stagger a row
 * with style={{ "--i": n }}). Only blocks still below the screen when the
 * page opens are hidden first, so nothing in view flashes, and nothing is
 * ever hidden without scripts or for visitors who ask for reduced motion.
 * Lives in the public template, so it runs again on every page.
 */
export function RevealOnScroll() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const waiting = [...document.querySelectorAll<HTMLElement>(".reveal")].filter(
      (el) => el.getBoundingClientRect().top > window.innerHeight,
    );
    if (waiting.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );
    for (const el of waiting) {
      el.classList.add("reveal-armed");
      observer.observe(el);
    }
    return () => {
      observer.disconnect();
      for (const el of waiting) el.classList.remove("reveal-armed", "is-in");
    };
  }, []);

  return null;
}

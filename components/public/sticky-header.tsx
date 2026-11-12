"use client";

import { useSyncExternalStore, type ReactNode } from "react";

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

/**
 * The public header's shell: it stays at the top of the screen, and lifts
 * off the page with a soft shadow once the page is scrolled.
 */
export function StickyHeader({ children }: { children: ReactNode }) {
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 8,
    () => false,
  );
  return (
    <header
      className={`sticky top-0 z-30 border-b border-line bg-white transition-shadow duration-250 ease-smooth ${
        scrolled ? "shadow-header" : ""
      }`}
    >
      {children}
    </header>
  );
}

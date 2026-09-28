import { ViewTransition } from "react";

// Only navigations tagged "nav-forward" / "nav-back" (top menu, category
// pills) slide; everything else — cards, footer links, browser back — swaps
// instantly. The CSS is at the end of app/globals.css.
const slide = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

/**
 * Slides its content out and the replacement in when it re-mounts during a
 * tagged navigation. Give it a `key` that changes with the content (e.g. the
 * category) when the route itself stays the same.
 */
export function SlideTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={slide} exit={slide} default="none">
      {children}
    </ViewTransition>
  );
}

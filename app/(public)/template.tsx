import { ViewTransition } from "react";

// Only navigations tagged by the top menu (nav-links.tsx) slide; everything
// else — cards, footer links, browser back — swaps instantly as before.
const slide = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

/**
 * Re-mounts on every public navigation, so the page content between the
 * header and footer can slide left or right (CSS in app/globals.css).
 */
export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={slide} exit={slide} default="none">
      {children}
    </ViewTransition>
  );
}

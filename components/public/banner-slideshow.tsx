"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { PauseIcon, PlayIcon } from "@/components/ui/icons";
import { BANNER_SLIDE_MS } from "@/lib/banners";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Photo background for a package listing banner: the photos fade from one to
 * the next every few seconds behind a navy overlay, darkest on the left where
 * the white title sits. The owner asked for autoplay,
 * so it has a Pause button, stops while the tab is hidden, and doesn't
 * autoplay for visitors who turned on "reduce motion". Place it inside a
 * `relative isolate overflow-hidden` container. Play/Pause stays in English
 * in both languages (owner's choice).
 */
export function BannerSlideshow({ images }: { images: { id: string; url: string }[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  const count = images.length;
  const playing = count > 1 && !paused && !reducedMotion;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      if (!document.hidden) setCurrent((c) => (c + 1) % count);
    }, BANNER_SLIDE_MS);
    return () => clearInterval(timer);
  }, [playing, count]);

  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {images.map((image, i) => (
          <Image
            key={image.id}
            src={image.url}
            alt=""
            fill
            sizes="100vw"
            // The first photo is the banner's first paint; the next one loads early so the fade never shows a gap.
            loading={i === current || i === (current + 1) % count ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : undefined}
            className={`object-cover transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-linear-to-r from-navy/90 via-navy/65 to-navy/35" />
      </div>

      {count > 1 && !reducedMotion && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          lang="en"
          aria-label={paused ? "Play the photo slideshow" : "Pause the photo slideshow"}
          className="absolute top-3 right-3 z-[1] flex min-h-12 items-center gap-2 rounded-lg bg-navy/70 px-3.5 text-meta font-bold text-white transition-colors duration-150 ease-smooth hover:bg-navy/90 sm:top-4 sm:right-4"
        >
          {paused ? <PlayIcon className="size-5" /> : <PauseIcon className="size-5" />}
          {paused ? "Play" : "Pause"}
        </button>
      )}
    </>
  );
}

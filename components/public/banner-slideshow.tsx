"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/components/public/i18n-provider";
import { BANNER_SLIDE_MS } from "@/lib/banners";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Photo background for a banner (homepage hero, package listing banners):
 * the photos fade from one to the next every few seconds behind a dark
 * overlay that keeps the white text readable. The owner asked for autoplay,
 * so it has a Pause button, stops while the tab is hidden, and doesn't
 * autoplay for visitors who turned on "reduce motion". Place it inside a
 * `relative isolate overflow-hidden` container.
 */
export function BannerSlideshow({ images }: { images: { id: string; url: string }[] }) {
  const { t } = useI18n();
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
        <div className="absolute inset-0 bg-linear-to-b from-navy/60 via-navy/45 to-navy/70" />
      </div>

      {count > 1 && !reducedMotion && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? t.slideshow.playLabel : t.slideshow.pauseLabel}
          className="absolute top-3 right-3 flex min-h-10 items-center gap-1.5 rounded-full bg-navy/60 px-3.5 text-sm font-semibold text-white hover:bg-navy/80 sm:top-4 sm:right-4"
        >
          {paused ? (
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
            </svg>
          )}
          {paused ? t.slideshow.play : t.slideshow.pause}
        </button>
      )}
    </>
  );
}

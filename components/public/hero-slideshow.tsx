"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/components/public/i18n-provider";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from "@/components/ui/icons";
import { fmt } from "@/lib/i18n/config";

export type HeroSlide = {
  /** The package's cover photo. */
  src: string;
  title: string;
  /** The package page. */
  href: string;
  /** "9 hari, 7 malam · dari RM 5,990". */
  meta: string;
};

/** How long each photo shows before fading to the next. */
const SLIDE_MS = 5000;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

const controlClass =
  "inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-lg bg-white/12 px-3 text-meta font-bold text-white transition-[background-color,transform] duration-150 ease-smooth hover:bg-white/24 active:translate-y-px";

/**
 * Homepage hero: the cover photo of each published package, in an order the
 * server shuffles on every visit (so the first photo arrives with the page).
 * The caption under the photo is the link to that package, and its hit area
 * covers the photo too.
 *
 * Same rules as the banner slideshows: it fades by itself, has a Pause
 * button (Play / Pause stay in English, the owner's choice), stops while the
 * tab is hidden and doesn't autoplay for visitors who ask for reduced
 * motion. It also holds still while the pointer is on the photo or the link
 * has keyboard focus, so the package that opens is the one being looked at.
 * A photo is only fetched when it is about to show, the fade waits for it to
 * load, and one that fails to load is skipped.
 */
export function HeroSlideshow({ slides, label }: { slides: HeroSlide[]; label: string }) {
  const { t } = useI18n();
  const count = slides.length;

  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  // The caption's words follow the photo a moment later, so they can dip out and back in.
  const [captionIndex, setCaptionIndex] = useState(0);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const [choice, setChoice] = useState<"play" | "pause" | null>(null);
  const [held, setHeld] = useState(false);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  const tabHidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.hidden,
    () => false,
  );
  const paused = choice ? choice === "pause" : reducedMotion;

  const current = useRef(0);
  const request = useRef(0);
  const ready = useRef(new Map<number, Promise<boolean>>());

  /** Fetches a photo ahead of its turn; resolves false if it can't be loaded. */
  const preload = useCallback(
    (i: number) => {
      let loaded = ready.current.get(i);
      if (!loaded) {
        const img = new window.Image();
        img.src = slides[i].src;
        loaded = img.decode().then(
          () => true,
          () => false,
        );
        ready.current.set(i, loaded);
      }
      return loaded;
    },
    [slides],
  );

  /** Fades to a photo once it has loaded, stepping past any that fail. */
  const go = useCallback(
    async (target: number, step: 1 | -1) => {
      const mine = ++request.current;
      let next = ((target % count) + count) % count;
      for (let tries = 0; tries < count; tries++) {
        if (next === current.current) return;
        const ok = await preload(next);
        if (mine !== request.current) return; // a newer click or tick took over
        if (ok) {
          setLeaving(current.current);
          current.current = next;
          setIndex(next);
          void preload((next + 1) % count);
          return;
        }
        next = (((next + step) % count) + count) % count;
      }
    },
    [count, preload],
  );

  // Autoplay.
  useEffect(() => {
    if (paused || held || tabHidden || count < 2) return;
    const timer = setTimeout(() => void go(index + 1, 1), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [paused, held, tabHidden, count, index, go]);

  // The photo underneath is dropped once the fade above it has finished.
  useEffect(() => {
    if (leaving === null) return;
    const timer = setTimeout(() => setLeaving(null), 800);
    return () => clearTimeout(timer);
  }, [leaving, index]);

  useEffect(() => {
    if (captionIndex === index) return;
    const timer = setTimeout(() => setCaptionIndex(index), 150);
    return () => clearTimeout(timer);
  }, [captionIndex, index]);

  if (count === 0) return null;
  const swapping = captionIndex !== index;
  const caption = slides[captionIndex];
  const shown = leaving !== null && leaving !== index ? [leaving, index] : [index];
  const captionMotion = `transition-[opacity,transform,text-decoration-color] duration-150 ease-in-out ${
    swapping ? "translate-y-1 opacity-0" : ""
  }`;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className={`relative min-w-0 ${paused || held ? "slides-paused" : ""}`}
    >
      <div
        className={`relative aspect-[3/2] overflow-hidden rounded-2xl bg-navy-deep max-mid:rounded-[16px] ${
          firstLoaded ? "" : "photo-loading"
        }`}
      >
        {shown.map((i) => (
          <div
            key={i}
            aria-hidden={i !== index || undefined}
            className={`absolute inset-0 ${i === index ? `z-[2] ${leaving !== null ? "slide-fade-in" : ""}` : "z-[1]"}`}
          >
            <Image
              src={slides[i].src}
              alt={fmt(t.slideshow.photoAlt, { title: slides[i].title })}
              fill
              sizes="(min-width: 900px) 56vw, 100vw"
              loading="eager"
              fetchPriority={i === 0 ? "high" : undefined}
              onLoad={i === 0 ? () => setFirstLoaded(true) : undefined}
              className="slide-drift object-cover"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-stretch max-sm:gap-3 sm:min-h-[88px]">
        <p aria-live={paused ? "polite" : "off"} className="min-w-0">
          {/* The caption is the link to the package; its hit area also covers the photo. */}
          <Link
            href={slides[index].href}
            onPointerEnter={(e) => e.pointerType === "mouse" && setHeld(true)}
            onPointerLeave={(e) => e.pointerType === "mouse" && setHeld(false)}
            onFocus={() => setHeld(true)}
            onBlur={() => setHeld(false)}
            className="nudge-group group block text-white no-underline after:absolute after:top-0 after:left-0 after:z-[3] after:aspect-[3/2] after:w-full after:rounded-2xl after:content-[''] max-sm:min-h-[88px] max-mid:after:rounded-[16px]"
          >
            <span
              className={`line-clamp-2 text-lead leading-[1.35] font-bold underline decoration-transparent decoration-[1.5px] underline-offset-[0.2em] group-hover:decoration-current ${captionMotion}`}
            >
              {caption.title}
            </span>
            <span className={`mt-0.5 flex items-center gap-2 text-white/82 ${captionMotion}`}>
              {caption.meta}
              <ArrowRightIcon className="nudge size-[18px] text-white" />
            </span>
          </Link>
        </p>

        {count > 1 && (
          <div className="flex flex-none gap-2 max-sm:grid max-sm:grid-cols-[56px_1fr_56px]">
            <button
              type="button"
              aria-label={t.slideshow.previous}
              onClick={() => {
                setChoice("pause");
                void go(index - 1, -1);
              }}
              className={controlClass}
            >
              <ChevronLeftIcon strokeWidth={2} className="size-[22px]" />
            </button>
            <button
              type="button"
              lang="en"
              onClick={() => setChoice(paused ? "play" : "pause")}
              className={`${controlClass} min-w-[104px]`}
            >
              {paused ? <PlayIcon className="size-[22px]" /> : <PauseIcon className="size-[22px]" />}
              {paused ? "Play" : "Pause"}
            </button>
            <button
              type="button"
              aria-label={t.slideshow.next}
              onClick={() => {
                setChoice("pause");
                void go(index + 1, 1);
              }}
              className={controlClass}
            >
              <ChevronRightIcon strokeWidth={2} className="size-[22px]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

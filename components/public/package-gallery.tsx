"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { PackageImage } from "@/components/public/package-image";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

/** A horizontal swipe longer than this (px) moves to the next/previous photo. */
const SWIPE_DISTANCE = 50;

const arrowButton =
  "absolute top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary-dark shadow-[0_4px_14px_rgba(13,44,78,0.25)] transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:size-14";

/**
 * Package photos (mockup 3.2.2): the photos sit side by side in a strip that
 * slides left/right, moved by the arrow buttons, a swipe, the keyboard or the
 * thumbnails. No auto-advance. Photos are 16:9, the shape admins crop to.
 */
export function PackageGallery({ images, title }: { images: { id: string; url: string }[]; title: string }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (images.length === 0) {
    return <PackageImage src={null} alt="" sizes="100vw" className="aspect-video rounded-[14px]" iconClassName="size-14" />;
  }

  const count = images.length;
  const go = (index: number) => setCurrent(Math.min(count - 1, Math.max(0, index)));

  return (
    <div>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={`Photos of ${title}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(current - 1);
          if (e.key === "ArrowRight") go(current + 1);
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const distance = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(distance) > SWIPE_DISTANCE) go(current + (distance < 0 ? 1 : -1));
        }}
        className="relative overflow-hidden rounded-[14px] bg-linear-135 from-primary-pale to-[#cfe1f2]"
      >
        <div
          className="flex transition-transform duration-[400ms] ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {images.map((image, i) => (
            <div
              key={image.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`Photo ${i + 1} of ${count}`}
              aria-hidden={i !== current}
              className="relative aspect-video w-full shrink-0"
            >
              <Image
                src={image.url}
                alt={i === current ? `${title} — photo ${i + 1} of ${count}` : ""}
                fill
                sizes="(min-width: 1160px) 1096px, 100vw"
                // The first photo is above the fold; neighbours load early so a slide never shows a blank.
                loading={Math.abs(i - current) <= 1 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(current - 1)}
              disabled={current === 0}
              aria-label="Previous photo"
              className={`${arrowButton} left-3 sm:left-4`}
            >
              <ChevronLeftIcon className="size-6 sm:size-7" />
            </button>
            <button
              type="button"
              onClick={() => go(current + 1)}
              disabled={current === count - 1}
              aria-label="Next photo"
              className={`${arrowButton} right-3 sm:right-4`}
            >
              <ChevronRightIcon className="size-6 sm:size-7" />
            </button>
            <p
              aria-live="polite"
              className="absolute right-3 bottom-3 rounded-full bg-navy/75 px-3 py-1 text-sm font-semibold text-white sm:right-4 sm:bottom-4"
            >
              {current + 1} / {count}
            </p>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="mt-3.5 grid grid-cols-4 gap-3 sm:grid-cols-5 sm:gap-3.5">
          {images.map((image, i) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-pressed={i === current}
                className={`block w-full overflow-hidden rounded-[10px] border-2 ${
                  i === current ? "border-accent" : "border-transparent hover:border-line"
                }`}
              >
                <PackageImage src={image.url} alt="" sizes="220px" className="aspect-video" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

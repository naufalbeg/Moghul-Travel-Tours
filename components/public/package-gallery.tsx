"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useI18n } from "@/components/public/i18n-provider";
import { PackageImage } from "@/components/public/package-image";
import { fmt } from "@/lib/i18n/config";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

/** A horizontal swipe longer than this (px) moves to the next/previous photo. */
const SWIPE_DISTANCE = 50;

const arrowButton =
  "absolute top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-lg bg-white/92 text-primary-dark shadow-[0_4px_14px_rgb(13_44_78/0.25)] transition-[opacity,background-color] duration-150 ease-smooth hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:size-14";

/**
 * Package photos (mockup 3.2.2): the photos sit side by side in a strip that
 * slides left/right, moved by the arrow buttons, a swipe, the keyboard or the
 * thumbnails. No auto-advance. Photos are 16:9, the shape admins crop to.
 */
export function PackageGallery({ images, title }: { images: { id: string; url: string }[]; title: string }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (images.length === 0) {
    return <PackageImage src={null} alt="" sizes="100vw" className="aspect-video rounded-2xl" iconClassName="size-14" />;
  }

  const count = images.length;
  const go = (index: number) => setCurrent(Math.min(count - 1, Math.max(0, index)));

  return (
    <div>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={fmt(t.packageGallery.label, { title })}
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
        className="relative overflow-hidden rounded-2xl bg-primary-pale max-mid:rounded-[16px]"
      >
        <div
          className="flex transition-transform duration-400 ease-smooth"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {images.map((image, i) => (
            <div
              key={image.id}
              role="group"
              aria-roledescription="slide"
              aria-label={fmt(t.packageGallery.slide, { n: i + 1, total: count })}
              aria-hidden={i !== current}
              className="relative aspect-video w-full shrink-0"
            >
              <Image
                src={image.url}
                alt={i === current ? fmt(t.packageGallery.alt, { title, n: i + 1, total: count }) : ""}
                fill
                sizes="(min-width: 1280px) 1200px, 100vw"
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
              aria-label={t.packageGallery.previous}
              className={`${arrowButton} left-3 sm:left-4`}
            >
              <ChevronLeftIcon strokeWidth={2} className="size-6 sm:size-7" />
            </button>
            <button
              type="button"
              onClick={() => go(current + 1)}
              disabled={current === count - 1}
              aria-label={t.packageGallery.next}
              className={`${arrowButton} right-3 sm:right-4`}
            >
              <ChevronRightIcon strokeWidth={2} className="size-6 sm:size-7" />
            </button>
            <p
              aria-live="polite"
              className="absolute right-3 bottom-3 rounded-lg bg-navy/86 px-3 py-1.5 text-fine font-bold text-white tabular-nums sm:right-4 sm:bottom-4"
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
                aria-label={fmt(t.packageGallery.show, { n: i + 1 })}
                aria-pressed={i === current}
                className={`block w-full overflow-hidden rounded-lg border-[3px] transition-colors duration-150 ease-smooth ${
                  i === current ? "border-primary-dark" : "border-transparent hover:border-field"
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

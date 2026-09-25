"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/ui/icons";

type Photo = { id: string; url: string; tag: string };

/**
 * Photo grid with a full-screen lightbox (REQ-MTT-004-005, SRS step 13).
 * Manual navigation only — no auto-advance, per the design rules.
 */
export function GalleryGrid({ photos }: { photos: Photo[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  const open = (i: number) => {
    setIndex(i);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();
  const step = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, step]);

  const current = index === null ? null : photos[index];

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => open(i)}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[10px] bg-primary-pale"
            >
              <Image
                src={photo.url}
                alt={photo.tag}
                fill
                sizes="(min-width: 1024px) 270px, (min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="sr-only">Open photo {i + 1} full screen</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setIndex(null)}
        aria-label="Photo viewer"
        className="m-0 h-full max-h-none w-full max-w-none bg-black/95 p-0 text-white backdrop:bg-black/80"
      >
        {current && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <p className="text-[15px]">
                <span className="font-semibold">{current.tag}</span>
                <span className="ml-3 text-white/60">
                  {index! + 1} of {photos.length}
                </span>
              </p>
              <button
                type="button"
                onClick={close}
                className="flex min-h-12 items-center gap-2 rounded-lg bg-white/10 px-4 font-semibold hover:bg-white/20"
              >
                <CloseIcon className="size-5" />
                Close
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              <Image src={current.url} alt={current.tag} fill sizes="100vw" className="object-contain" />
            </div>
            {photos.length > 1 && (
              <div className="flex justify-center gap-3 px-4 py-4">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="min-h-12 min-w-32 rounded-lg bg-white/10 px-5 font-semibold hover:bg-white/20"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="min-h-12 min-w-32 rounded-lg bg-white/10 px-5 font-semibold hover:bg-white/20"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

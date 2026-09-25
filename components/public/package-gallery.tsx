"use client";

import { useState } from "react";
import { PackageImage } from "@/components/public/package-image";

/** Main photo with clickable thumbnails (mockup 3.2.2). No auto-advance. */
export function PackageGallery({ images, title }: { images: { id: string; url: string }[]; title: string }) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return <PackageImage src={null} alt="" sizes="100vw" className="aspect-[16/7] rounded-[14px]" iconClassName="size-14" />;
  }

  return (
    <div>
      <PackageImage
        src={images[current].url}
        alt={`${title} — photo ${current + 1} of ${images.length}`}
        sizes="(min-width: 1160px) 1096px, 100vw"
        priority
        className="aspect-[16/9] rounded-[14px] sm:aspect-[16/7]"
      />
      {images.length > 1 && (
        <ul className="mt-3.5 grid grid-cols-4 gap-3 sm:grid-cols-5 sm:gap-3.5">
          {images.map((image, i) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-pressed={i === current}
                className={`block w-full overflow-hidden rounded-[10px] border-2 ${
                  i === current ? "border-accent" : "border-transparent hover:border-line"
                }`}
              >
                <PackageImage src={image.url} alt="" sizes="220px" className="aspect-[4/3] sm:aspect-[5/2]" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

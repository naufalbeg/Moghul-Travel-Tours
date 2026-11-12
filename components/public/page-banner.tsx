import type { ReactNode } from "react";
import { BannerSlideshow } from "@/components/public/banner-slideshow";
import type { BannerImageData } from "@/lib/banner-images";

/**
 * Navy title band for inner pages, left-aligned like the homepage hero. With
 * `images` it becomes taller and shows them as a fading photo slideshow
 * behind the title.
 */
export function PageBanner({
  title,
  images = [],
  children,
}: {
  title: string;
  images?: BannerImageData[];
  children?: ReactNode;
}) {
  const hasPhotos = images.length > 0;
  return (
    <div
      className={`on-dark relative isolate overflow-hidden bg-navy text-white ${
        hasPhotos ? "py-20 sm:py-28" : "py-[clamp(40px,5vw,64px)]"
      }`}
    >
      {hasPhotos && <BannerSlideshow images={images} />}
      <div className="wrap">
        <h1 className="text-[clamp(32px,4vw,48px)] leading-[1.05] font-extrabold tracking-[-0.025em] text-white">
          {title}
        </h1>
        {children && <p className="mt-3.5 max-w-[60ch] text-lead text-white/86">{children}</p>}
      </div>
    </div>
  );
}

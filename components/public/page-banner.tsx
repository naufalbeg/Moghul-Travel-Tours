import type { CSSProperties, ReactNode } from "react";
import { BannerSlideshow } from "@/components/public/banner-slideshow";
import type { BannerImageData } from "@/lib/banner-images";

/**
 * Navy title band for inner pages, left-aligned like the homepage hero; the
 * title and the line under it rise in once, as the hero's do. With `images`
 * it becomes taller and shows them as a fading photo slideshow behind the
 * title. `overlap` leaves room at the bottom for a search bar that sits
 * across the band's lower edge (the Packages page).
 */
export function PageBanner({
  title,
  images = [],
  overlap = false,
  children,
}: {
  title: string;
  images?: BannerImageData[];
  overlap?: boolean;
  children?: ReactNode;
}) {
  const hasPhotos = images.length > 0;
  const padding = hasPhotos
    ? overlap
      ? "pt-20 pb-[calc(5rem+44px)] sm:pt-28 sm:pb-[calc(7rem+44px)]"
      : "py-20 sm:py-28"
    : overlap
      ? "pt-[clamp(40px,5vw,64px)] pb-[calc(clamp(40px,5vw,64px)+44px)]"
      : "py-[clamp(40px,5vw,64px)]";
  return (
    <div className={`on-dark relative isolate overflow-hidden bg-navy text-white ${padding}`}>
      {hasPhotos && <BannerSlideshow images={images} />}
      <div className="wrap">
        <h1 className="rise text-[clamp(32px,4vw,48px)] leading-[1.05] font-extrabold tracking-[-0.025em] text-white">
          {title}
        </h1>
        {children && (
          <p className="rise mt-3.5 max-w-[60ch] text-lead text-white/86" style={{ "--i": 1 } as CSSProperties}>
            {children}
          </p>
        )}
      </div>
    </div>
  );
}

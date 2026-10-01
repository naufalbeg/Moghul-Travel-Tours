import type { ReactNode } from "react";
import { BannerSlideshow } from "@/components/public/banner-slideshow";
import type { BannerImageData } from "@/lib/banner-images";

/**
 * Blue title banner for inner pages (mockup 3.2.1). With `images` it becomes
 * taller and shows them as a fading photo slideshow behind the title.
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
      className={`relative isolate overflow-hidden bg-hero px-4 text-center sm:px-8 ${
        hasPhotos ? "py-20 sm:py-28" : "py-12"
      }`}
    >
      {hasPhotos && <BannerSlideshow images={images} />}
      <h1 className="mb-2.5 text-[28px] text-white sm:text-[32px]">{title}</h1>
      {children && <p className="mx-auto max-w-[520px] text-[17px] text-white/88">{children}</p>}
    </div>
  );
}

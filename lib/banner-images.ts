import "server-only";
import { prisma } from "@/lib/prisma";

export type BannerImageData = { id: string; url: string };

/** BannerController (public side): a banner's slideshow photos, in order. */
export function getBannerImages(banner: string): Promise<BannerImageData[]> {
  return prisma.bannerImage.findMany({
    where: { banner },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, url: true },
  });
}

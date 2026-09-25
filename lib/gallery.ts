import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

// Read side of GalleryController (SDD 4.2.4), shared by the public gallery
// and the admin panel. Always read per request so uploads show immediately.

/** listImages — newest first, optionally filtered by tag (REQ-MTT-004-005/006). */
export async function listGalleryImages(tag?: string) {
  await connection();
  return prisma.galleryImage.findMany({
    where: tag ? { tag } : undefined,
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, tag: true },
  });
}

/** Distinct tags with photo counts, most-used first — for the filter pills. */
export async function listGalleryTags() {
  await connection();
  const rows = await prisma.galleryImage.groupBy({
    by: ["tag"],
    _count: { _all: true },
    orderBy: { _count: { tag: "desc" } },
  });
  return rows.map((r) => ({ tag: r.tag, count: r._count._all }));
}

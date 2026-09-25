import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";

// Rebuilt on every request so newly published packages appear straight away.
export const dynamic = "force-dynamic";

/** sitemap.xml — every public page plus each published package. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/packages`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/gallery`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/testimonials`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${base}/inquire`, changeFrequency: "yearly", priority: 0.5 },
  ];

  try {
    const packages = await prisma.package.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
    });
    for (const p of packages) {
      pages.push({ url: `${base}/packages/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.8 });
    }
  } catch (error) {
    console.error("sitemap: couldn't load packages", error);
  }
  return pages;
}

import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { SITE_CONTENT_DEFAULTS, SITE_CONTENT_KEYS, type SiteContent } from "@/lib/site-content";

/**
 * ContentController.getContent (SDD 4.2.6): saved site_config values merged
 * over the defaults. Read per request so edits show immediately, and
 * deduplicated so the layout and page share one query.
 *
 * If the database is unreachable the site still renders with the defaults.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  await connection();
  const content: SiteContent = { ...SITE_CONTENT_DEFAULTS };
  try {
    const rows = await prisma.siteConfig.findMany({
      where: { key: { in: SITE_CONTENT_KEYS } },
      select: { key: true, value: true },
    });
    for (const row of rows) content[row.key as keyof SiteContent] = row.value;
  } catch (error) {
    console.error("Failed to load site_config, using defaults", error);
  }
  return content;
});

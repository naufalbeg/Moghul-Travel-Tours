import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/** robots.txt — everything public is crawlable; the admin area isn't. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

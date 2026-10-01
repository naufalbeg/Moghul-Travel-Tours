// The banners that can show a photo slideshow. Shared by server and client —
// keep server-only imports out. Keys are stored in banner_images.banner.
import { CATEGORY_FILTERS } from "@/lib/package-labels";

export const BANNERS = [
  { key: "home", label: "Homepage", page: "/" },
  { key: "packages", label: "Packages — All packages", page: "/packages" },
  ...CATEGORY_FILTERS.map((f) => ({
    key: `packages-${f.slug}`,
    label: `Packages — ${f.label}`,
    page: `/packages?category=${f.slug}`,
  })),
];

export const BANNER_KEYS = BANNERS.map((b) => b.key);

/** The package listing banner for a category filter slug (none = "All packages"). */
export const packagesBannerKey = (categorySlug: string | undefined) =>
  categorySlug ? `packages-${categorySlug}` : "packages";

/** How long each slideshow photo shows before fading to the next. */
export const BANNER_SLIDE_MS = 3000;

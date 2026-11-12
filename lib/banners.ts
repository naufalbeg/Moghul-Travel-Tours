// The photo slots admins fill at /admin/banners. Shared by server and client —
// keep server-only imports out. Keys are stored in banner_images.banner.
import { CATEGORY_FILTERS } from "@/lib/package-labels";

export type BannerSlot = {
  key: string;
  /** Admin-facing name (English). */
  label: string;
  /** The public page it shows on. */
  page: string;
  kind: "strip" | "door";
  /** Width ÷ height every photo is cropped to. */
  aspect: number;
  /** Longest side kept after cropping, in pixels. */
  maxWidth: number;
  /** How many photos the slot holds. */
  max: number;
};

/** Package-listing banners: a wide strip, up to five photos that fade in turn. */
const STRIP = { kind: "strip", aspect: 3, maxWidth: 2400, max: 5 } as const;
/** The homepage's two category "doors": one 3:2 photo each. */
const DOOR = { kind: "door", aspect: 3 / 2, maxWidth: 1600, max: 1 } as const;

export const doorPhotoKey = (categorySlug: string) => `door-${categorySlug}`;

/** The package listing banner for a category filter slug (none = "All packages"). */
export const packagesBannerKey = (categorySlug: string | undefined) =>
  categorySlug ? `packages-${categorySlug}` : "packages";

// The old "home" slot (photos behind the previous homepage hero) is no longer
// listed: the hero now shows package cover photos. Its rows are left alone.
export const BANNERS: BannerSlot[] = [
  { key: doorPhotoKey("umrah-ziarah"), label: "Homepage — Umrah & Ziarah photo", page: "/", ...DOOR },
  { key: doorPhotoKey("outbound"), label: "Homepage — Holidays abroad photo", page: "/", ...DOOR },
  { key: packagesBannerKey(undefined), label: "Packages — All packages", page: "/packages", ...STRIP },
  ...CATEGORY_FILTERS.map((f) => ({
    key: packagesBannerKey(f.slug),
    label: `Packages — ${f.label}`,
    page: `/packages?category=${f.slug}`,
    ...STRIP,
  })),
];

export const BANNER_KEYS = BANNERS.map((b) => b.key);
export const bannerSlot = (key: string) => BANNERS.find((b) => b.key === key);

/** How long each slideshow photo shows before fading to the next. */
export const BANNER_SLIDE_MS = 3000;

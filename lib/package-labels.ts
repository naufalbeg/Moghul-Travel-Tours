import type {
  DepartureAvailability,
  PackageAvailability,
  PackageCategory,
} from "@/generated/prisma/enums";

export const CATEGORY_LABEL: Record<PackageCategory, string> = {
  UMRAH: "Umrah",
  ZIARAH: "Ziarah",
  GROUP_TOUR: "Group tour",
  DOMESTIC: "Domestic",
};

/**
 * Public category filters (URL ?category=...). Umrah and Ziarah share one
 * menu entry on the site, but "umrah" and "ziarah" still work on their own.
 */
export const CATEGORY_FILTERS = [
  { slug: "umrah-ziarah", label: "Umrah & Ziarah", categories: ["UMRAH", "ZIARAH"] },
  { slug: "group-tour", label: "Group Tours", categories: ["GROUP_TOUR"] },
  { slug: "domestic", label: "Domestic", categories: ["DOMESTIC"] },
] as const satisfies readonly {
  slug: string;
  label: string;
  categories: readonly PackageCategory[];
}[];

const EXTRA_FILTERS: Record<string, { label: string; categories: readonly PackageCategory[] }> = {
  umrah: { label: "Umrah", categories: ["UMRAH"] },
  ziarah: { label: "Ziarah", categories: ["ZIARAH"] },
};

export function resolveCategoryFilter(slug: string | undefined) {
  if (!slug) return null;
  const main = CATEGORY_FILTERS.find((f) => f.slug === slug);
  if (main) return main;
  const extra = EXTRA_FILTERS[slug];
  return extra ? { slug, ...extra } : null;
}

type Pill = { label: string; className: string };

export const PACKAGE_AVAILABILITY: Record<PackageAvailability, Pill> = {
  OPEN: { label: "Open for booking", className: "bg-success-pale text-success" },
  ALMOST_FULL: { label: "Almost full", className: "bg-accent-pale text-accent-dark" },
  FULL: { label: "Fully booked", className: "bg-line text-muted" },
  COMING_SOON: { label: "Coming soon", className: "bg-primary-pale text-primary" },
};

export const DEPARTURE_AVAILABILITY: Record<DepartureAvailability, Pill> = {
  OPEN: { label: "Open", className: "bg-success-pale text-success" },
  ALMOST_FULL: { label: "Almost full", className: "bg-accent-pale text-accent-dark" },
  FULL: { label: "Full", className: "bg-line text-muted" },
};

export function durationLabel(days: number | null, nights: number | null) {
  if (!days) return null;
  const d = `${days} day${days === 1 ? "" : "s"}`;
  return nights ? `${d}, ${nights} night${nights === 1 ? "" : "s"}` : d;
}

export function dayLabel(start: number, end: number | null) {
  return end && end > start ? `Day ${start}–${end}` : `Day ${start}`;
}

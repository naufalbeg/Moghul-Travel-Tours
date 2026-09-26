import type {
  DepartureAvailability,
  PackageAvailability,
  PackageCategory,
} from "@/generated/prisma/enums";

export const CATEGORY_LABEL: Record<PackageCategory, string> = {
  UMRAH_ZIARAH: "Umrah & Ziarah",
  OUTBOUND: "Outbound",
  INBOUND: "Inbound",
  CRUISE: "Cruise",
};

/**
 * Public category filters (URL ?category=...). The aliases keep older or
 * hand-typed links working ("group-tour" and "domestic" were the previous
 * names of Outbound and Inbound).
 */
export const CATEGORY_FILTERS = [
  { slug: "umrah-ziarah", label: "Umrah & Ziarah", categories: ["UMRAH_ZIARAH"] },
  { slug: "outbound", label: "Outbound", categories: ["OUTBOUND"] },
  { slug: "inbound", label: "Inbound", categories: ["INBOUND"] },
  { slug: "cruise", label: "Cruise", categories: ["CRUISE"] },
] as const satisfies readonly {
  slug: string;
  label: string;
  categories: readonly PackageCategory[];
}[];

const FILTER_ALIASES: Record<string, string> = {
  umrah: "umrah-ziarah",
  ziarah: "umrah-ziarah",
  "group-tour": "outbound",
  domestic: "inbound",
};

export function resolveCategoryFilter(slug: string | undefined) {
  if (!slug) return null;
  const target = FILTER_ALIASES[slug] ?? slug;
  return CATEGORY_FILTERS.find((f) => f.slug === target) ?? null;
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

import type {
  DepartureAvailability,
  PackageAvailability,
  PackageCategory,
} from "@/generated/prisma/enums";
import { fmt } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/ms";

// Labels here are English, for the admin portal. The public site shows the
// same things from the visitor's dictionary (lib/i18n) — the pill colours
// below are shared.

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

/** "10 days, 9 nights" / "10 hari, 9 malam". */
export function durationLabel(days: number | null, nights: number | null, t: Dictionary["duration"]) {
  if (!days) return null;
  const d = fmt(days === 1 ? t.oneDay : t.days, { n: days });
  return nights ? `${d}, ${fmt(nights === 1 ? t.oneNight : t.nights, { n: nights })}` : d;
}

/** "Day 2–4" / "Hari 2–4". */
export function dayLabel(start: number, end: number | null, t: Dictionary["duration"]) {
  return end && end > start ? fmt(t.dayRange, { start, end }) : fmt(t.day, { n: start });
}

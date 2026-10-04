import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";

const ringgit = new Intl.NumberFormat("en-MY", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 9800 → "RM 9,800". Accepts Prisma Decimals. */
export function formatPrice(value: number | { toString(): string }) {
  return `RM ${ringgit.format(Number(value.toString()))}`;
}

/**
 * Formats a calendar date (Postgres DATE, stored as UTC midnight) as
 * "14 Mar 2027" ("14 Mac 2027" in Malay) without shifting it across time
 * zones. The admin portal uses English.
 */
export function formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}, locale: Locale = "en") {
  return date.toLocaleDateString(INTL_LOCALE[locale], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  });
}

/** Today's calendar date in Malaysia, as UTC midnight (comparable to DATE columns). */
export function todayInMalaysia() {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(
    new Date(),
  );
  return new Date(`${ymd}T00:00:00Z`);
}

/** "Nurul Huda binti Rahman" → "NH" (skips bin/binti). */
export function initials(name: string) {
  const words = name.split(/\s+/).filter((w) => w && !/^(bin|binti|bte|bt|a\/l|a\/p)$/i.test(w));
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

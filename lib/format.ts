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
 * "14 Mar 2027" without shifting it across time zones.
 */
export function formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}) {
  return date.toLocaleDateString("en-GB", {
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

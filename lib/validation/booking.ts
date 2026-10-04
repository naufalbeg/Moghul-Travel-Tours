import { z } from "zod";
import type { DepartureAvailability, PackageAvailability } from "@/generated/prisma/enums";
import { code, collectErrors, contactFields, messageField, type FormErrorCode } from "@/lib/validation/inquiry";

// Booking form on a package page ("Borang Tempahan"). Shared by the form
// (instant feedback) and submitBooking (the real check, which also checks
// the date and prices against the package itself).

export const MAX_PAX_PER_OPTION = 20;
/** Bigger groups are arranged directly with the office. */
export const MAX_PAX_TOTAL = 50;

/**
 * Online booking is open while the package is Open or Almost full and has
 * an upcoming date with seats. Otherwise the page offers only the inquiry.
 */
export function canBookOnline(
  availability: PackageAvailability,
  upcomingDepartures: readonly { availability: DepartureAvailability }[],
) {
  return (
    (availability === "OPEN" || availability === "ALMOST_FULL") &&
    upcomingDepartures.some((d) => d.availability !== "FULL")
  );
}

export const bookingSchema = z.object({
  ...contactFields,
  departureDate: z.iso.date(code("departureRequired")),
  /** Travellers per price option, keyed "<TRAVELLER>.<ROOM>" (priceCellKey). */
  travellers: z.record(
    z.string().max(40),
    z.int(code("invalid")).min(0, code("invalid")).max(MAX_PAX_PER_OPTION, code("paxTooMany")),
  ),
  message: messageField,
});

export type BookingInput = z.input<typeof bookingSchema>;
export type BookingErrors = Partial<Record<keyof BookingInput | "captcha", FormErrorCode>>;

export function validateBooking(input: BookingInput) {
  const result = bookingSchema.safeParse(input);
  const errors = result.success ? {} : collectErrors<keyof BookingErrors>(result.error.issues);

  // The traveller rules only need the counts, so they're reported alongside
  // any other mistakes — the visitor sees everything to fix at once.
  const travellers = bookingSchema.shape.travellers.safeParse(input?.travellers);
  if (travellers.success && !errors.travellers) {
    const counts = Object.entries(travellers.data);
    const total = counts.reduce((sum, [, n]) => sum + n, 0);
    const adults = counts.filter(([key]) => key.startsWith("ADULT.")).reduce((sum, [, n]) => sum + n, 0);
    if (adults < 1) errors.travellers = "paxRequired";
    else if (total > MAX_PAX_TOTAL) errors.travellers = "paxTooMany";
  }

  return Object.keys(errors).length > 0 || !result.success
    ? ({ ok: false, errors } as const)
    : ({ ok: true, values: result.data } as const);
}

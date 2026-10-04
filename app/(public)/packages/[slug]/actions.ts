"use server";

import { verifyCaptcha } from "@/lib/captcha";
import { sendInquiryNotification } from "@/lib/email";
import { formatPrice, formatTripDates, todayInMalaysia } from "@/lib/format";
import { optionLabel, priceCellKey, toPriceCells, type BookedTraveller } from "@/lib/package-prices";
import { prisma } from "@/lib/prisma";
import { inquiryNotifyEmail } from "@/lib/site-config";
import { canBookOnline, validateBooking, type BookingErrors, type BookingInput } from "@/lib/validation/booking";
import type { FormBannerCode } from "@/lib/validation/inquiry";

/** `message` and `errors` are codes; the form shows them in the visitor's language. */
export type SubmitBookingResult = { ok: true } | { ok: false; message: FormBannerCode; errors?: BookingErrors };

/**
 * Booking request from a package page's "Borang Tempahan". Saved as an
 * inquiry (kind BOOKING) for the team to confirm with the customer — no
 * payment online. Validate → CAPTCHA → re-check the date and prices against
 * the package (never trust the browser's totals) → save → email the admin.
 * Like inquiries, a failed email never blocks the booking.
 */
export async function submitBooking(
  slug: string,
  input: BookingInput,
  captchaToken: string | null,
): Promise<SubmitBookingResult> {
  const result = validateBooking(input);
  if (!result.ok) return { ok: false, message: "checkFields", errors: result.errors };

  if (!(await verifyCaptcha(captchaToken))) {
    return { ok: false, message: "captchaFailed", errors: { captcha: "captcha" } };
  }
  const v = result.values;

  const pkg =
    typeof slug === "string"
      ? await prisma.package.findFirst({
          where: { slug: slug.slice(0, 200), status: "PUBLISHED", deletedAt: null },
          select: {
            id: true,
            title: true,
            availability: true,
            durationDays: true,
            departures: {
              where: { departureDate: { gte: todayInMalaysia() } },
              select: { departureDate: true, availability: true },
            },
            prices: { select: { traveller: true, room: true, amount: true } },
          },
        })
      : null;
  if (!pkg || !canBookOnline(pkg.availability, pkg.departures)) return { ok: false, message: "bookingUnavailable" };

  const departure = pkg.departures.find((d) => d.departureDate.toISOString().slice(0, 10) === v.departureDate);
  if (!departure || departure.availability === "FULL") {
    return { ok: false, message: "checkFields", errors: { departureDate: "departureUnavailable" } };
  }

  // Price each traveller from the database, not from the browser.
  const prices = toPriceCells(pkg.prices);
  const travellers: BookedTraveller[] = [];
  for (const [key, count] of Object.entries(v.travellers)) {
    if (count === 0) continue;
    const cell = prices.find((c) => priceCellKey(c.traveller, c.room) === key && c.amount > 0);
    // The page offered a price that has since been removed — it was edited meanwhile.
    if (!cell) return { ok: false, message: "pageOutdated" };
    travellers.push({ traveller: cell.traveller, room: cell.room, count, amount: cell.amount });
  }
  const total = travellers.reduce((sum, t) => sum + t.count * t.amount, 0);

  const inquiry = await prisma.inquiry.create({
    data: {
      kind: "BOOKING",
      fullName: v.fullName,
      phone: v.phone,
      email: v.email,
      packageInterest: pkg.title,
      packageId: pkg.id,
      message: v.message,
      departureDate: departure.departureDate,
      travellers,
      estimatedTotal: total,
    },
  });

  const sent = await sendInquiryNotification(await inquiryNotifyEmail(), {
    ...inquiry,
    booking: {
      departure: formatTripDates(departure.departureDate, pkg.durationDays),
      travellers: travellers.map((t) => `${t.count} × ${optionLabel(t.traveller, t.room)} @ ${formatPrice(t.amount)}`),
      total: formatPrice(total),
    },
  });
  if (sent) await prisma.inquiry.update({ where: { id: inquiry.id }, data: { notifiedAt: new Date() } });

  return { ok: true };
}

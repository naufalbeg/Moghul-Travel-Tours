import type { InquiryKind, InquiryStatus } from "@/generated/prisma/enums";
import { bookedTravellers } from "@/lib/package-prices";

/** Booking requests from a package page's booking form stand out in the admin lists. */
export const INQUIRY_KIND: Record<InquiryKind, { label: string; className: string }> = {
  INQUIRY: { label: "Inquiry", className: "bg-canvas text-muted" },
  BOOKING: { label: "Booking request", className: "bg-primary text-white" },
};

/** Total people on a booking request (inquiries.travellers JSON). */
export const bookedPax = (travellers: unknown) => bookedTravellers(travellers).reduce((sum, t) => sum + t.count, 0);

export const INQUIRY_STATUS: Record<InquiryStatus, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-accent-pale text-accent-dark" },
  IN_PROGRESS: { label: "In progress", className: "bg-primary-pale text-primary" },
  RESOLVED: { label: "Resolved", className: "bg-success-pale text-success" },
};

export const INQUIRY_STATUS_ORDER: InquiryStatus[] = ["NEW", "IN_PROGRESS", "RESOLVED"];

/** "26 Sep 2026, 3:45 pm" in Malaysian time. */
export function formatReceived(at: Date) {
  return at.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kuala_Lumpur",
  });
}

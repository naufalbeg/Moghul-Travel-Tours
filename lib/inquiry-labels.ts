import type { InquiryStatus } from "@/generated/prisma/enums";

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

import { z } from "zod";
import { todayInMalaysia } from "@/lib/format";

// Shared by the admin announcement form and its server action (SRS 3.7:
// title and body required, expiry date optional).

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Enter a short headline.").max(120, "Keep the headline under 120 characters."),
  body: z.string().trim().min(1, "Enter the announcement text.").max(400, "Keep it under 400 characters — it's shown in a banner."),
  expiresOn: z.union([
    z.literal(""),
    z.iso
      .date("Pick a valid date.")
      .refine((d) => new Date(`${d}T00:00:00Z`) >= todayInMalaysia(), "The end date can't be in the past."),
  ]),
});

export type AnnouncementInput = z.input<typeof announcementSchema>;
export type AnnouncementErrors = Partial<Record<keyof AnnouncementInput, string>>;

export function validateAnnouncement(input: AnnouncementInput) {
  const result = announcementSchema.safeParse(input);
  if (result.success) return { ok: true, values: result.data } as const;
  const errors: AnnouncementErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof AnnouncementErrors;
    errors[key] ??= issue.message;
  }
  return { ok: false, errors } as const;
}

/** "2027-03-14" → the last second of that day in Malaysia (UTC+8), as UTC. */
export function endOfMalaysianDay(date: string) {
  return new Date(`${date}T23:59:59+08:00`);
}

/** The Malaysian calendar date of an expires_at timestamp, "YYYY-MM-DD". */
export function malaysianDate(at: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(at);
}

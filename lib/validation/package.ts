import { z } from "zod";
import { IMAGE_BUCKETS, MAX_PACKAGE_IMAGES } from "@/lib/storage-config";

// Shared by the admin package form (instant feedback) and the savePackage
// server action (the real check). Keep it free of server-only imports.

export const CATEGORIES = ["UMRAH_ZIARAH", "OUTBOUND", "INBOUND", "CRUISE"] as const;
export const AVAILABILITIES = ["OPEN", "ALMOST_FULL", "FULL", "COMING_SOON"] as const;
export const DEPARTURE_AVAILABILITIES = ["OPEN", "ALMOST_FULL", "FULL"] as const;

const line = z.string().trim().min(1).max(200);

/** Object paths we issue for package photos: "<uuid>.<ext>" inside the bucket. */
export const PACKAGE_IMAGE_PATH = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

export const packageSchema = z.object({
  title: z.string().trim().min(1, "Package title is required.").max(150, "Keep the title under 150 characters."),
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "Use lowercase letters, numbers and single dashes only."),
  category: z.enum(CATEGORIES, "Choose a category."),
  description: z.string().trim().max(5000, "Keep the description under 5,000 characters."),
  highlights: z.array(line).max(6, "Up to 6 highlights."),
  inclusions: z.array(line).max(20, "Up to 20 items."),
  durationDays: z.int("Enter whole days.").min(1).max(90).nullable(),
  durationNights: z.int("Enter whole nights.").min(0).max(90).nullable(),
  roomSharing: z.string().trim().max(80),
  price: z.number("Enter a price in RM.").min(0).max(9_999_999).nullable(),
  availability: z.enum(AVAILABILITIES),
  itinerary: z
    .array(
      z
        .object({
          dayStart: z.int("Enter a day number.").min(1, "Days start at 1.").max(90),
          dayEnd: z.int().min(1).max(90).nullable(),
          title: z.string().trim().min(1, "Give this day a title.").max(150),
          description: z.string().trim().max(2000),
        })
        .refine((d) => d.dayEnd === null || d.dayEnd >= d.dayStart, {
          path: ["dayEnd"],
          message: "The last day can't be before the first day.",
        }),
    )
    .max(60),
  departures: z
    .array(
      z.object({
        date: z.iso.date("Pick a date."),
        availability: z.enum(DEPARTURE_AVAILABILITIES),
      }),
    )
    .max(40)
    .refine((list) => new Set(list.map((d) => d.date)).size === list.length, {
      message: "Each departure date can only be listed once.",
    }),
  images: z
    .array(z.object({ storagePath: z.string().regex(PACKAGE_IMAGE_PATH), isPrimary: z.boolean() }))
    .max(MAX_PACKAGE_IMAGES, `Up to ${MAX_PACKAGE_IMAGES} images.`),
});

export type PackageInput = z.input<typeof packageSchema>;
export type PackageValues = z.output<typeof packageSchema>;
export type SaveIntent = "draft" | "publish";
export type FieldErrors = Record<string, string>;

/**
 * Validates for the chosen action. Drafts only need a title; publishing
 * needs everything a visitor relies on (SRS: at least one image).
 */
export function validatePackage(input: PackageInput, intent: SaveIntent) {
  const result = packageSchema.safeParse(input);
  const errors: FieldErrors = {};

  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "form";
      errors[key] ??= issue.message;
    }
  }

  if (intent === "publish") {
    if (!input.description?.trim()) errors.description ??= "Add a short description before publishing.";
    if (!input.price || input.price <= 0) errors.price ??= "Enter the price per person before publishing.";
    if (!input.images?.length) errors.images ??= "At least one image is required.";
  }

  return Object.keys(errors).length > 0 || !result.success
    ? ({ ok: false, errors } as const)
    : ({ ok: true, values: result.data } as const);
}

export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

export const PACKAGE_BUCKET = IMAGE_BUCKETS.packages;

import { z } from "zod";

// Shared by the admin testimonial form and its server action (SRS 3.5:
// customer name, trip name and review text required; rating 1–5).

export const testimonialSchema = z.object({
  customerName: z.string().trim().min(1, "Enter the customer's name.").max(100, "Keep the name under 100 characters."),
  tripName: z.string().trim().min(1, "Enter the trip or package they went on.").max(150),
  reviewText: z.string().trim().min(1, "Enter what the customer said.").max(2000, "Keep the review under 2,000 characters."),
  starRating: z.int().min(1, "Choose a rating from 1 to 5 stars.").max(5, "Choose a rating from 1 to 5 stars."),
  tripDate: z.union([z.literal(""), z.iso.date("Pick a valid date.")]),
});

export type TestimonialInput = z.input<typeof testimonialSchema>;
export type TestimonialErrors = Partial<Record<keyof TestimonialInput | "form", string>>;

export function validateTestimonial(input: TestimonialInput) {
  const result = testimonialSchema.safeParse(input);
  if (result.success) return { ok: true, values: result.data } as const;
  const errors: TestimonialErrors = {};
  for (const issue of result.error.issues) {
    const key = (issue.path[0] ?? "form") as keyof TestimonialErrors;
    errors[key] ??= issue.message;
  }
  return { ok: false, errors } as const;
}

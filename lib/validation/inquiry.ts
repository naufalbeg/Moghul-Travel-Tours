import { z } from "zod";

// Shared by the public inquiry form and submitInquiry (SRS 3.3: all fields
// except Message are required; email must be valid).

/** Value of the "not sure yet" option in the package dropdown. */
export const GENERAL_INQUIRY = "general";

export const inquirySchema = z.object({
  fullName: z.string().trim().min(1, "Please enter your name.").max(100, "Please keep your name under 100 characters."),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number.")
    .refine((v) => /^[+()\d\s-]*$/.test(v), "Please enter a phone number using digits only.")
    .refine((v) => {
      const digits = v.replace(/\D/g, "").length;
      return digits >= 8 && digits <= 15;
    }, "Please enter a full phone number, e.g. 012-345 6789."),
  email: z.email("Please enter a valid email address, e.g. name@gmail.com.").max(120),
  packageInterest: z.string().trim().min(1, "Please choose a package, or “Not sure yet”.").max(150),
  message: z.string().trim().max(2000, "Please keep your message under 2,000 characters."),
});

export type InquiryInput = z.input<typeof inquirySchema>;
export type InquiryErrors = Partial<Record<keyof InquiryInput | "captcha", string>>;

export function validateInquiry(input: InquiryInput) {
  const result = inquirySchema.safeParse(input);
  if (result.success) return { ok: true, values: result.data } as const;
  const errors: InquiryErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof InquiryErrors;
    errors[key] ??= issue.message;
  }
  return { ok: false, errors } as const;
}

import { z } from "zod";

// Shared by the public inquiry form and submitInquiry (SRS 3.3: all fields
// except Message are required; email must be valid). The contact fields and
// error codes are also used by the booking form (lib/validation/booking.ts).
// Errors are codes, not sentences — forms show them in the visitor's
// language (client.formErrors in lib/i18n).

/** Value of the "not sure yet" option in the package dropdown. */
export const GENERAL_INQUIRY = "general";

export type FormErrorCode =
  | "nameRequired"
  | "nameTooLong"
  | "phoneRequired"
  | "phoneDigits"
  | "phoneIncomplete"
  | "emailInvalid"
  | "packageRequired"
  | "messageTooLong"
  | "departureRequired"
  | "departureUnavailable"
  | "paxRequired"
  | "paxTooMany"
  | "captcha"
  | "invalid";

/** Banner messages above a form. */
export type FormBannerCode = "checkFields" | "captchaFailed" | "bookingUnavailable" | "pageOutdated";

export const code = (c: FormErrorCode) => c;

/** Name, phone and email — the same rules on every public form. */
export const contactFields = {
  fullName: z.string(code("invalid")).trim().min(1, code("nameRequired")).max(100, code("nameTooLong")),
  phone: z
    .string(code("invalid"))
    .trim()
    .min(1, code("phoneRequired"))
    .refine((v) => /^[+()\d\s-]*$/.test(v), code("phoneDigits"))
    .refine((v) => {
      const digits = v.replace(/\D/g, "").length;
      return digits >= 8 && digits <= 15;
    }, code("phoneIncomplete")),
  email: z.email(code("emailInvalid")).max(120, code("emailInvalid")),
};

/** Optional free text (inquiry message, booking notes). */
export const messageField = z.string(code("invalid")).trim().max(2000, code("messageTooLong"));

export const inquirySchema = z.object({
  ...contactFields,
  packageInterest: z.string(code("invalid")).trim().min(1, code("packageRequired")).max(150, code("packageRequired")),
  message: messageField,
});

export type InquiryInput = z.input<typeof inquirySchema>;
export type InquiryErrors = Partial<Record<keyof InquiryInput | "captcha", FormErrorCode>>;

/** Zod issues → { field: code }, keeping the first issue for each field. */
export function collectErrors<K extends string>(issues: readonly z.core.$ZodIssue[]) {
  const errors: Partial<Record<K, FormErrorCode>> = {};
  for (const issue of issues) {
    const key = issue.path[0] as K;
    errors[key] ??= issue.message as FormErrorCode;
  }
  return errors;
}

export function validateInquiry(input: InquiryInput) {
  const result = inquirySchema.safeParse(input);
  if (result.success) return { ok: true, values: result.data } as const;
  return { ok: false, errors: collectErrors<keyof InquiryErrors>(result.error.issues) } as const;
}

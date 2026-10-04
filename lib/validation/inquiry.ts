import { z } from "zod";

// Shared by the public inquiry form and submitInquiry (SRS 3.3: all fields
// except Message are required; email must be valid). Errors are codes, not
// sentences — the form shows them in the visitor's language
// (client.inquiry.errors in lib/i18n).

/** Value of the "not sure yet" option in the package dropdown. */
export const GENERAL_INQUIRY = "general";

export type InquiryErrorCode =
  | "nameRequired"
  | "nameTooLong"
  | "phoneRequired"
  | "phoneDigits"
  | "phoneIncomplete"
  | "emailInvalid"
  | "packageRequired"
  | "messageTooLong"
  | "captcha"
  | "invalid";

/** Banner messages above the form. */
export type InquiryBannerCode = "checkFields" | "captchaFailed";

const code = (c: InquiryErrorCode) => c;

export const inquirySchema = z.object({
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
  packageInterest: z.string(code("invalid")).trim().min(1, code("packageRequired")).max(150, code("packageRequired")),
  message: z.string(code("invalid")).trim().max(2000, code("messageTooLong")),
});

export type InquiryInput = z.input<typeof inquirySchema>;
export type InquiryErrors = Partial<Record<keyof InquiryInput | "captcha", InquiryErrorCode>>;

export function validateInquiry(input: InquiryInput) {
  const result = inquirySchema.safeParse(input);
  if (result.success) return { ok: true, values: result.data } as const;
  const errors: InquiryErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof InquiryErrors;
    errors[key] ??= issue.message as InquiryErrorCode;
  }
  return { ok: false, errors } as const;
}

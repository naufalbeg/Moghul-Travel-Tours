"use server";

import { verifyCaptcha } from "@/lib/captcha";
import { sendInquiryNotification } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content";
import { GENERAL_INQUIRY, validateInquiry, type InquiryErrors, type InquiryInput } from "@/lib/validation/inquiry";

export type SubmitInquiryResult = { ok: true } | { ok: false; message: string; errors?: InquiryErrors };

/**
 * InquiryController.createInquiry (SDD 4.2.3) — REQ-MTT-003-002…006.
 * Public endpoint: validate → verify CAPTCHA → save as NEW → email the
 * admin. The email is best-effort (SRS E2): if it fails the inquiry is
 * still saved and the visitor still sees the success message.
 */
export async function submitInquiry(input: InquiryInput, captchaToken: string | null): Promise<SubmitInquiryResult> {
  const result = validateInquiry(input);
  if (!result.ok) {
    return { ok: false, message: "Please check the highlighted fields.", errors: result.errors };
  }

  if (!(await verifyCaptcha(captchaToken))) {
    return {
      ok: false,
      message: "Please complete the “I am human” check and try again.",
      errors: { captcha: "Please tick the box to show you're not a robot." },
    };
  }

  const v = result.values;
  const inquiry = await prisma.inquiry.create({
    data: {
      fullName: v.fullName,
      phone: v.phone,
      email: v.email,
      packageInterest: v.packageInterest === GENERAL_INQUIRY ? null : v.packageInterest,
      message: v.message,
    },
  });

  const recipient =
    (await prisma.siteConfig.findUnique({ where: { key: "inquiry_notify_email" }, select: { value: true } }))?.value ||
    SITE_CONTENT_DEFAULTS.inquiry_notify_email;

  if (await sendInquiryNotification(recipient, inquiry)) {
    await prisma.inquiry.update({ where: { id: inquiry.id }, data: { notifiedAt: new Date() } });
  }

  return { ok: true };
}

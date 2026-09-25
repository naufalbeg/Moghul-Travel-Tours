import { z } from "zod";
import { toIntlPhone, type SiteContentKey } from "@/lib/site-content";

// Shared by the admin content editor and updateSiteContent (SRS 3.6 rules:
// social links must be valid URLs, phone numbers must be Malaysian).

const required = (max: number) =>
  z.string().trim().min(1, "This can't be empty.").max(max, `Keep this under ${max} characters.`);

const malaysianPhone = z
  .string()
  .trim()
  .max(30)
  .refine(
    (v) => /^[+()\d\s-]+$/.test(v) && /^60\d{8,10}$/.test(toIntlPhone(v)),
    "Enter a Malaysian number, e.g. 03-5888 3401 or 012-345 6789.",
  );

const optionalPhone = z.union([z.literal(""), malaysianPhone]);

const optionalUrl = z.union([
  z.literal(""),
  z.url({ protocol: /^https?$/, error: "Enter the full link, starting with https://" }).max(300),
]);

export const siteContentSchema = z.object({
  about_summary: required(400),
  about_story: required(6000),
  address: required(300),
  phone: malaysianPhone,
  mobile: optionalPhone,
  whatsapp: malaysianPhone,
  email: z.email("Enter a valid email address.").max(120),
  alt_email: z.union([z.literal(""), z.email("Enter a valid email address.").max(120)]),
  office_hours: required(300),
  motac_license: required(40),
  company_reg: required(40),
  matta_member: z.string().trim().max(40),
  facebook_url: optionalUrl,
  instagram_url: optionalUrl,
  tiktok_url: optionalUrl,
}) satisfies z.ZodType<Record<SiteContentKey, string>>;

export type ContentErrors = Partial<Record<SiteContentKey, string>>;

export function validateSiteContent(input: Record<SiteContentKey, string>) {
  const result = siteContentSchema.safeParse(input);
  if (result.success) return { ok: true, values: result.data } as const;
  const errors: ContentErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as SiteContentKey;
    errors[key] ??= issue.message;
  }
  return { ok: false, errors } as const;
}

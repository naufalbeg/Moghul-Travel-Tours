import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { privacyNotice } from "@/lib/legal";
import { getSiteContent } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: t.meta.privacyTitle,
    description: t.meta.privacyDescription,
    alternates: { canonical: "/privacy" },
  };
}

/** Privacy notice (Personal Data Protection Act 2010): Malay and English on one page. */
export default async function PrivacyPage() {
  const [content, locale] = await Promise.all([getSiteContent(), getLocale()]);
  return <LegalPage documents={privacyNotice(content)} locale={locale} />;
}

import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { termsOfUse } from "@/lib/legal";
import { getSiteContent } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: t.meta.termsTitle,
    description: t.meta.termsDescription,
    alternates: { canonical: "/terms" },
  };
}

/** Terms of use: how prices, booking requests and outside links work. Malay and English on one page. */
export default async function TermsPage() {
  const [content, locale] = await Promise.all([getSiteContent(), getLocale()]);
  return <LegalPage documents={termsOfUse(content)} locale={locale} />;
}

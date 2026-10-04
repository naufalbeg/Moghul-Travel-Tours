import Link from "next/link";
import { I18nProvider } from "@/components/public/i18n-provider";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { WhatsAppIcon } from "@/components/ui/icons";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getPublicContent } from "@/lib/site-config";
import { whatsappHref } from "@/lib/site-content";

export default async function NotFound() {
  const [content, locale, t] = await Promise.all([getPublicContent(), getLocale(), getDictionary()]);
  return (
    <I18nProvider locale={locale} t={t.client}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader content={content} />
        <main className="flex flex-1 items-center justify-center px-4 py-20 text-center">
          <div className="max-w-[520px]">
            <h1 className="mb-3 text-[28px] text-primary-dark">{t.notFound.title}</h1>
            <p className="mb-8 text-muted">{t.notFound.text}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/packages"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-6 font-bold text-white hover:bg-accent-dark"
              >
                {t.notFound.browse}
              </Link>
              <a
                href={whatsappHref(content, t.whatsapp.askPackage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary px-6 font-bold text-primary"
              >
                <WhatsAppIcon className="size-5" />
                {t.layout.whatsappUs}
              </a>
            </div>
          </div>
        </main>
        <SiteFooter content={content} />
      </div>
    </I18nProvider>
  );
}

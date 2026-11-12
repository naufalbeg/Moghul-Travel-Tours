import Link from "next/link";
import { ContactBar } from "@/components/public/contact-bar";
import { I18nProvider } from "@/components/public/i18n-provider";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { ArrowRightIcon, WhatsAppIcon } from "@/components/ui/icons";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getPublicContent } from "@/lib/site-config";
import { whatsappHref } from "@/lib/site-content";

export default async function NotFound() {
  const [content, locale, t] = await Promise.all([getPublicContent(), getLocale(), getDictionary()]);
  return (
    <I18nProvider locale={locale} t={t.client}>
      <div className="flex min-h-screen flex-col pb-[84px] sm:pb-0">
        <SiteHeader content={content} />
        <main className="flex flex-1 items-center">
          <div className="wrap py-20">
            <h1 className="text-[clamp(32px,4vw,48px)] leading-[1.05] font-extrabold tracking-[-0.025em] text-primary-dark">
              {t.notFound.title}
            </h1>
            <p className="mt-4 mb-8 max-w-[52ch] text-lead text-muted">{t.notFound.text}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/packages" className="btn btn-accent">
                {t.notFound.browse}
                <ArrowRightIcon className="nudge size-[22px]" />
              </Link>
              <a
                href={whatsappHref(content, t.whatsapp.askPackage)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-wa"
              >
                <WhatsAppIcon className="size-[22px]" />
                {t.layout.whatsappUs}
              </a>
            </div>
          </div>
        </main>
        <SiteFooter content={content} />
        <ContactBar content={content} />
      </div>
    </I18nProvider>
  );
}

import { AnnouncementBar } from "@/components/public/announcement-bar";
import { ContactBar } from "@/components/public/contact-bar";
import { I18nProvider } from "@/components/public/i18n-provider";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getPublicContent } from "@/lib/site-config";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [content, locale, t] = await Promise.all([getPublicContent(), getLocale(), getDictionary()]);
  return (
    <I18nProvider locale={locale} t={t.client}>
      {/* Bottom padding on phones: room for the pinned WhatsApp | Telefon bar. */}
      <div className="flex min-h-screen flex-col pb-[84px] sm:pb-0">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary-dark focus:px-[18px] focus:py-3 focus:font-bold focus:text-white"
        >
          {t.layout.skipToContent}
        </a>
        <AnnouncementBar />
        <SiteHeader content={content} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter content={content} />
        <ContactBar content={content} />
      </div>
    </I18nProvider>
  );
}

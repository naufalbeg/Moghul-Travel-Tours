import { AnnouncementBar } from "@/components/public/announcement-bar";
import { I18nProvider } from "@/components/public/i18n-provider";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getPublicContent } from "@/lib/site-config";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [content, locale, t] = await Promise.all([getPublicContent(), getLocale(), getDictionary()]);
  return (
    <I18nProvider locale={locale} t={t.client}>
      <div className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
        >
          {t.layout.skipToContent}
        </a>
        <AnnouncementBar />
        <SiteHeader content={content} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter content={content} />
        <WhatsAppButton content={content} />
      </div>
    </I18nProvider>
  );
}

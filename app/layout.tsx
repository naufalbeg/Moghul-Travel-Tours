import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { SITE } from "@/lib/site";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

// One typeface for the whole site: designed for low-vision readers, which
// suits an audience in their 40s to 60s. A variable font, so every weight
// from 200 to 800 comes in one file.
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  display: "swap",
  // next/font has no size-matched fallback for this typeface, so name plain ones.
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${SITE.name} — ${t.meta.siteTitle}`,
      template: `%s | ${SITE.name}`,
    },
    description: t.meta.siteDescription,
    openGraph: { type: "website", siteName: SITE.name, locale: t.meta.ogLocale },
  };
}

/** The page language follows the visitor's BM | EN choice (the admin portal marks itself English). */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={await getLocale()} className={atkinson.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

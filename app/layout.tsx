import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { SITE } from "@/lib/site";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
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
    <html lang={await getLocale()} className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

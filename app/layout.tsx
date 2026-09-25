import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE.name} — Umrah, Ziarah & Group Tours`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "MOTAC-licensed Malaysian travel agency offering Umrah, Ziarah, group tours, and domestic packages.",
  openGraph: { type: "website", siteName: SITE.name, locale: "en_MY" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

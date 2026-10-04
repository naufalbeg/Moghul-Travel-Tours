import Link from "next/link";
import { Logo } from "@/components/ui/logo-mark";
import { LanguageSwitch } from "@/components/public/language-switch";
import { ActiveNavList } from "@/components/public/nav-links";
import { MobileMenu } from "@/components/public/mobile-menu";
import { fmt } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { SITE } from "@/lib/site";
import type { SiteContent } from "@/lib/site-content";

export async function SiteHeader({ content }: { content: SiteContent }) {
  const t = await getDictionary();
  return (
    <header className="relative border-b border-line bg-white">
      {/* Deliberately low-key: staff need it, visitors shouldn't be drawn to it. English in both languages. */}
      <Link
        href="/admin/login"
        lang="en"
        className="absolute top-3 right-6 hidden text-[13px] font-medium text-muted/80 hover:text-primary hover:underline lg:block"
      >
        Admin login
      </Link>
      <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:justify-center lg:pt-5 lg:pb-3">
        <Link href="/" aria-label={fmt(t.layout.homeLink, { name: SITE.name })} className="min-w-0">
          <Logo priority className="h-11 w-auto min-[400px]:h-12 sm:h-16 lg:h-[76px]" />
        </Link>
        {/* Phones and tablets: language switch beside the menu button, always visible. */}
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <LanguageSwitch />
          <MobileMenu phone={content.phone} whatsapp={content.whatsapp} />
        </div>
      </div>

      {/* Desktop: the switch sits at the end of the menu bar. */}
      <div className="hidden items-center justify-center gap-x-8 px-8 pb-[18px] lg:flex">
        <nav aria-label={t.client.nav.label}>
          <ActiveNavList variant="desktop" />
        </nav>
        <LanguageSwitch />
      </div>
    </header>
  );
}

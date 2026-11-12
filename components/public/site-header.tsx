import Link from "next/link";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo-mark";
import { LanguageSwitch } from "@/components/public/language-switch";
import { ActiveNavList } from "@/components/public/nav-links";
import { MobileMenu } from "@/components/public/mobile-menu";
import { StickyHeader } from "@/components/public/sticky-header";
import { fmt } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { SITE } from "@/lib/site";
import { whatsappHref, type SiteContent } from "@/lib/site-content";

/**
 * One line: logo, menu, BM | EN, and the WhatsApp number as a button. Below
 * 1240px the menu folds into a Menu button; on phones the WhatsApp button
 * moves to the bar pinned to the bottom of the screen (ContactBar).
 */
export async function SiteHeader({ content }: { content: SiteContent }) {
  const t = await getDictionary();
  return (
    <StickyHeader>
      <div className="wrap flex min-h-[72px] items-center gap-3 sm:min-h-[88px] sm:gap-5">
        <Link href="/" aria-label={fmt(t.layout.homeLink, { name: SITE.name })} className="min-w-0 shrink">
          <Logo priority className="h-11 w-auto max-w-full object-contain object-left sm:h-[60px]" />
        </Link>

        <nav aria-label={t.client.nav.label} className="ml-auto hidden nav:block">
          <ActiveNavList variant="desktop" />
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:gap-3.5 nav:ml-0">
          <LanguageSwitch />
          <a
            href={whatsappHref(content, t.whatsapp.askPackage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-wa btn-sm hidden whitespace-nowrap sm:inline-flex"
          >
            <WhatsAppIcon className="size-[22px]" />
            <span>
              <span className="sr-only">WhatsApp </span>
              {content.whatsapp}
            </span>
          </a>
          <MobileMenu />
        </div>
      </div>
    </StickyHeader>
  );
}

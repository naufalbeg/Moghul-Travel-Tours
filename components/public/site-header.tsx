import Link from "next/link";
import { Suspense } from "react";
import { LogoMark } from "@/components/ui/logo-mark";
import { ActiveNavList, NavList } from "@/components/public/nav-links";
import { MobileMenu } from "@/components/public/mobile-menu";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="relative border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:justify-center lg:pt-5 lg:pb-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <LogoMark className="size-10 sm:size-12" iconClassName="size-[22px] sm:size-[26px]" />
          <span className="font-heading text-[17px] leading-tight font-bold text-primary-dark sm:text-[22px]">
            {SITE.name}
            <span className="block font-sans text-[13px] font-medium text-accent-dark">
              {SITE.tagline}
            </span>
          </span>
        </Link>
        <MobileMenu />
      </div>

      <nav aria-label="Main" className="hidden px-8 pb-[18px] lg:block">
        <Suspense fallback={<NavList variant="desktop" />}>
          <ActiveNavList variant="desktop" />
        </Suspense>
      </nav>
    </header>
  );
}

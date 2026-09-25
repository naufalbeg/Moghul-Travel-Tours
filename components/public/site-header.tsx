import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/ui/logo-mark";
import { ActiveNavList, NavList } from "@/components/public/nav-links";
import { MobileMenu } from "@/components/public/mobile-menu";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="relative border-b border-line bg-white">
      {/* Deliberately low-key: staff need it, visitors shouldn't be drawn to it. */}
      <Link
        href="/admin/login"
        className="absolute top-3 right-6 hidden text-[13px] font-medium text-muted/80 hover:text-primary hover:underline lg:block"
      >
        Admin login
      </Link>
      <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:justify-center lg:pt-5 lg:pb-3">
        <Link href="/" aria-label={`${SITE.name} — home`} className="min-w-0">
          <Logo priority className="h-12 w-auto sm:h-16 lg:h-[76px]" />
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

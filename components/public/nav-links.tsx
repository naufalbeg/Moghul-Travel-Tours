"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/public/i18n-provider";
import { ExternalIcon } from "@/components/ui/icons";
import { PUBLIC_NAV } from "@/lib/site";

type NavHref = (typeof PUBLIC_NAV)[number]["href"];

function useIsActive() {
  const pathname = usePathname();

  return (href: NavHref) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };
}

type Variant = "desktop" | "mobile";

const linkStyles: Record<Variant, { base: string; active: string; idle: string }> = {
  desktop: {
    base: "border-b-2 px-0.5 py-1.5 text-base font-semibold transition-colors hover:border-accent hover:text-primary",
    active: "border-accent text-primary",
    idle: "border-transparent text-ink",
  },
  mobile: {
    base: "block rounded-lg px-4 py-3.5 text-lg font-semibold",
    active: "bg-primary-pale text-primary",
    idle: "text-ink hover:bg-canvas",
  },
};

export function NavList({
  variant,
  isActive = () => false,
  onNavigate,
}: {
  variant: Variant;
  isActive?: (href: NavHref) => boolean;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();
  const s = linkStyles[variant];
  // Menu items to the right of the current page slide the content in from
  // the right, items to the left from the left (app/(public)/template.tsx).
  const current = PUBLIC_NAV.findIndex(({ href }) => isActive(href));
  return (
    <ul className={variant === "desktop" ? "flex flex-wrap justify-center gap-x-7 gap-y-2" : "space-y-1"}>
      {PUBLIC_NAV.map((item, i) => {
        const { href, key } = item;
        if ("external" in item) {
          return (
            <li key={href}>
              <a href={href} target="_blank" rel="noopener" onClick={onNavigate} className={`${s.base} ${s.idle}`}>
                <span className="inline-flex items-center gap-1.5">
                  {t.nav[key]}
                  <ExternalIcon className="size-4 shrink-0" />
                </span>
                <span className="sr-only"> {t.nav.newTab}</span>
              </a>
            </li>
          );
        }
        const active = i === current;
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              transitionTypes={current === -1 || active ? undefined : [i > current ? "nav-forward" : "nav-back"]}
              aria-current={active ? "page" : undefined}
              className={`${s.base} ${active ? s.active : s.idle}`}
            >
              {t.nav[key]}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** NavList with active-link highlighting. */
export function ActiveNavList(props: { variant: Variant; onNavigate?: () => void }) {
  const isActive = useIsActive();
  return <NavList {...props} isActive={isActive} />;
}

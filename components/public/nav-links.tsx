"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { PUBLIC_NAV } from "@/lib/site";

type NavHref = (typeof PUBLIC_NAV)[number]["href"];

function useIsActive() {
  const pathname = usePathname();
  const category = useSearchParams().get("category");

  return (href: NavHref) => {
    const [path, query] = href.split("?");
    if (path === "/") return pathname === "/";
    if (path === "/packages") {
      if (!pathname.startsWith("/packages")) return false;
      const hrefCategory = new URLSearchParams(query).get("category");
      return hrefCategory === category;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
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
  const s = linkStyles[variant];
  return (
    <ul className={variant === "desktop" ? "flex flex-wrap justify-center gap-x-7 gap-y-2" : "space-y-1"}>
      {PUBLIC_NAV.map(({ href, label }) => {
        const active = isActive(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`${s.base} ${active ? s.active : s.idle}`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** NavList with active-link highlighting. Must sit inside <Suspense>. */
export function ActiveNavList(props: { variant: Variant; onNavigate?: () => void }) {
  const isActive = useIsActive();
  return <NavList {...props} isActive={isActive} />;
}

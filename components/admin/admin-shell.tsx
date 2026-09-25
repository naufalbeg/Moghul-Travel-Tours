"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut } from "@/app/admin/actions";
import { ADMIN_NAV, isNavItemActive, titleForPath } from "@/components/admin/admin-nav";
import { CloseIcon, LogoutIcon, MenuIcon } from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo-mark";
import type { AdminUser } from "@/lib/auth";
import { SITE } from "@/lib/site";

const roleLabel = { MASTER_ADMIN: "Master Admin", ADMIN: "Admin" } as const;

function initials(name: string) {
  const words = name.split(/\s+/).filter((w) => !/^(bin|binti|bte|bt)$/i.test(w));
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

export function AdminShell({ admin, children }: { admin: AdminUser; children: ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen text-[15px]">
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy/55 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-[250px] shrink-0 flex-col bg-navy py-6 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-[18px] flex items-center gap-2.5 border-b border-white/10 px-[22px] pb-[22px]">
          <LogoMark variant="dark" className="size-9" iconClassName="size-5" />
          <div className="font-heading text-[15px] leading-snug font-bold">
            {SITE.name}
            <span className="block font-sans text-xs font-normal text-white/55">Admin portal</span>
          </div>
        </div>

        <nav aria-label="Admin" className="flex-1 overflow-y-auto">
          {ADMIN_NAV.map((group) => {
            // Only two roles exist, so a minRole always means Master Admin.
            const items = group.items.filter(
              (item) => !item.minRole || admin.role === "MASTER_ADMIN",
            );
            if (items.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="px-[22px] pt-3.5 pb-2 text-xs font-bold tracking-wide text-white/40">
                  {group.label}
                </p>
                <ul>
                  {items.map(({ href, label, Icon }) => {
                    const active = isNavItemActive(href, pathname);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setDrawerOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-center gap-3 border-l-[3px] px-[22px] py-[11px] ${
                            active
                              ? "border-accent bg-white/8 font-semibold text-white"
                              : "border-transparent font-medium text-white/82 hover:text-white"
                          }`}
                        >
                          <Icon className="size-[19px] shrink-0" />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <form action={signOut} className="mt-auto border-t border-white/10 px-[22px] pt-4">
          <button
            type="submit"
            className="flex items-center gap-2.5 pt-2 font-semibold text-white/75 hover:text-white"
          >
            <LogoutIcon className="size-[18px]" />
            Log out
          </button>
        </form>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-line bg-white px-4 py-[18px] sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen((o) => !o)}
              aria-expanded={drawerOpen}
              aria-controls="admin-sidebar"
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              className="flex size-11 items-center justify-center rounded-lg border border-line text-primary-dark lg:hidden"
            >
              {drawerOpen ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
            </button>
            <h1 className="text-xl text-primary-dark">{titleForPath(pathname)}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-snug sm:block">
              <div className="font-bold">{admin.name}</div>
              <span className="mt-0.5 inline-block rounded-full bg-accent-pale px-2.5 py-0.5 text-xs font-bold text-accent-dark">
                {roleLabel[admin.role]}
              </span>
            </div>
            <span className="flex size-10 items-center justify-center rounded-full bg-primary-pale font-heading font-bold text-primary">
              {initials(admin.name)}
            </span>
          </div>
        </header>

        <div className="p-4 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

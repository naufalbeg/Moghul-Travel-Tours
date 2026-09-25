"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { CloseIcon, MenuIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { ActiveNavList, NavList } from "@/components/public/nav-links";
import { telHref, whatsappHref } from "@/lib/site-content";

export function MobileMenu({ phone, whatsapp }: { phone: string; whatsapp: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="shrink-0 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="flex min-h-12 items-center gap-2 rounded-lg border-[1.5px] border-line px-4 font-semibold text-primary-dark"
      >
        {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
        {open ? "Close" : "Menu"}
      </button>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="absolute inset-x-0 top-full z-40 border-b border-line bg-white px-4 pt-3 pb-5 shadow-lg"
        >
          <Suspense fallback={<NavList variant="mobile" onNavigate={close} />}>
            <ActiveNavList variant="mobile" onNavigate={close} />
          </Suspense>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <a
              href={telHref(phone)}
              className="flex min-h-13 items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary font-bold text-primary"
            >
              <PhoneIcon className="size-5" />
              Call us
            </a>
            <a
              href={whatsappHref({ whatsapp })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-13 items-center justify-center gap-2 rounded-lg bg-[#1f9d55] font-bold text-white"
            >
              <WhatsAppIcon className="size-5" />
              WhatsApp
            </a>
          </div>

          <Link
            href="/admin/login"
            onClick={close}
            className="mt-4 block text-center text-[13px] font-medium text-muted hover:text-primary"
          >
            Admin login
          </Link>
        </nav>
      )}
    </div>
  );
}

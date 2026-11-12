"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { useI18n } from "@/components/public/i18n-provider";
import { ActiveNavList } from "@/components/public/nav-links";

/**
 * The top menu on phones and tablets: a Menu button that opens a small panel
 * under it. Closes on a choice, on Escape and on a tap anywhere else.
 */
export function MobileMenu() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={root} className="relative nav:hidden">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className={`flex min-h-12 items-center gap-2 rounded-lg border-[1.5px] border-field px-3.5 font-bold text-ink transition-colors duration-150 ease-smooth hover:bg-canvas ${
          open ? "bg-canvas" : "bg-white"
        }`}
      >
        {open ? <CloseIcon className="size-[22px]" /> : <MenuIcon className="size-[22px]" />}
        {t.menu.open}
      </button>

      {open && (
        // Inner corners = the panel's 14px corner minus its 8px padding.
        <nav
          id="mobile-menu"
          aria-label={t.nav.label}
          className="absolute top-[calc(100%+10px)] right-0 z-40 w-[min(320px,calc(100vw-32px))] rounded-xl border border-line bg-white p-2 shadow-panel"
        >
          <ActiveNavList variant="mobile" onNavigate={() => setOpen(false)} />
        </nav>
      )}
    </div>
  );
}

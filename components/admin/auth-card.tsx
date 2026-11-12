import Link from "next/link";
import type { ReactNode } from "react";
import { LockIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo-mark";

/** The centred white card on the brand navy used by the sign-in pages. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-navy px-4 py-10">
      <Link
        href="/"
        className="on-dark self-start font-bold text-white/86 underline decoration-transparent underline-offset-[0.2em] hover:text-white hover:decoration-current sm:absolute sm:top-7 sm:left-8"
      >
        ← Back to moghultt.com
      </Link>

      <div className="w-full max-w-[440px] rounded-2xl bg-white px-6 pt-10 pb-8 shadow-search sm:px-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo priority className="mb-2 h-auto w-full max-w-[280px]" />
          <span className="text-fine font-bold text-muted">Admin portal</span>
        </div>
        <div className="mb-6 text-center">
          <h1 className="mb-1.5 text-price font-extrabold text-primary-dark">{title}</h1>
          {subtitle && <p className="text-meta text-muted">{subtitle}</p>}
        </div>
        {children}
        <hr className="mt-6 mb-5 border-line" />
        <p className="flex items-center justify-center gap-2 text-sm text-muted">
          <LockIcon className="size-[15px] shrink-0" />
          Staff access only — sessions are encrypted and logged.
        </p>
      </div>
    </main>
  );
}

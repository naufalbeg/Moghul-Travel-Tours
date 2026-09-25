import Link from "next/link";
import type { ReactNode } from "react";
import { LockIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo-mark";

/** The centred white card on a blue background used by the sign-in pages (mockup 3.1.4). */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-hero flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Link
        href="/"
        className="self-start text-[15px] font-semibold text-white/85 hover:text-white sm:absolute sm:top-7 sm:left-8"
      >
        ← Back to moghultt.com
      </Link>

      <div className="w-full max-w-[420px] rounded-2xl bg-white px-6 pt-10 pb-8 shadow-[0_20px_50px_rgba(18,58,102,0.28)] sm:px-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo priority className="mb-2 h-auto w-full max-w-[280px]" />
          <span className="text-sm font-medium text-accent-dark">Admin portal</span>
        </div>
        <div className="mb-6 text-center">
          <h1 className="mb-1.5 text-[22px]">{title}</h1>
          {subtitle && <p className="text-[15px] text-muted">{subtitle}</p>}
        </div>
        {children}
        <hr className="mt-6 mb-5 border-line" />
        <p className="flex items-center justify-center gap-2 text-[13px] text-muted">
          <LockIcon className="size-[15px] shrink-0" />
          Staff access only — sessions are encrypted and logged.
        </p>
      </div>
    </div>
  );
}

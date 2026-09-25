import type { Metadata } from "next";
import Link from "next/link";
import { LockIcon } from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo-mark";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Sign in" };

// Placeholder — the working sign-in form (with lockout after 5 failed
// attempts) is the next build step.
export default function LoginPage() {
  return (
    <div className="bg-hero relative flex min-h-screen items-center justify-center px-5 py-10">
      <Link href="/" className="absolute top-7 left-8 text-[15px] font-semibold text-white/85">
        ← Back to moghultt.com
      </Link>

      <div className="w-full max-w-[420px] rounded-2xl bg-white px-10 pt-11 pb-9 shadow-[0_20px_50px_rgba(18,58,102,0.28)]">
        <div className="mb-7 flex flex-col items-center text-center">
          <LogoMark className="mb-3.5 size-14" iconClassName="size-[30px]" />
          <p className="font-heading text-xl font-bold text-primary-dark">{SITE.name}</p>
          <span className="text-sm font-medium text-accent-dark">Admin portal</span>
        </div>
        <h1 className="mb-1.5 text-center text-[22px]">Sign in to your dashboard</h1>
        <p className="mb-6 text-center text-[15px] text-muted">
          Sign-in is being set up and will be available shortly.
        </p>
        <hr className="my-5 border-line" />
        <p className="flex items-center justify-center gap-2 text-[13px] text-muted">
          <LockIcon className="size-[15px] shrink-0" />
          Staff access only — sessions are encrypted and logged.
        </p>
      </div>
    </div>
  );
}

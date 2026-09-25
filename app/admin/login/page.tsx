import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LockIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo-mark";
import { getCurrentAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

/** LoginPage [PKG-MTT-001-001] — mockups 3.1.4 and 3.1.8. */
export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");

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
          <h1 className="mb-1.5 text-[22px]">Sign in to your dashboard</h1>
          <p className="text-[15px] text-muted">Enter your credentials to continue.</p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm leading-relaxed text-muted">
          New staff account? Ask your Master Admin to send you an invite.
        </p>
        <hr className="mt-6 mb-5 border-line" />
        <p className="flex items-center justify-center gap-2 text-[13px] text-muted">
          <LockIcon className="size-[15px] shrink-0" />
          Staff access only — sessions are encrypted and logged.
        </p>
      </div>
    </div>
  );
}

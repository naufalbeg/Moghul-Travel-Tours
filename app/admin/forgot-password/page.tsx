"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/admin/auth-card";
import { Alert } from "@/components/ui/alert";
import { requestPasswordReset, type ForgotState } from "./actions";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<ForgotState, FormData>(requestPasswordReset, { status: "idle" });

  if (state.status === "sent") {
    return (
      <AuthCard title="Check your email">
        <p className="mb-6 text-center text-meta text-muted">
          If <strong className="text-ink">{state.email}</strong> belongs to an admin account, we&apos;ve sent it a link
          to choose a new password. The link works for 1 hour — check your spam folder too.
        </p>
        <Link
          href="/admin/login"
          className="flex min-h-12 items-center justify-center rounded-lg border-[1.5px] border-field font-semibold"
        >
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter your email and we'll send you a link to choose a new one.">
      <form action={formAction} noValidate className="space-y-5">
        {state.status === "error" && <Alert tone="error" title={state.message} />}
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="w-full rounded-lg border-[1.5px] border-field px-4 py-3.5 text-base"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-5 py-[15px] text-body font-bold text-ink hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
        <p className="text-center text-sm">
          <Link href="/admin/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { PasswordInput } from "@/components/ui/password-input";
import { login, type LoginState } from "./actions";

const inputBase =
  "w-full rounded-lg border-[1.5px] px-4 py-3.5 text-base text-ink placeholder:text-muted/80 focus:border-primary focus:outline-none disabled:border-line disabled:bg-[#f1f3f5] disabled:text-muted";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {
    status: "idle",
  });

  const locked = state.status === "locked";
  const invalid = state.status === "error";
  const inputClass = `${inputBase} ${invalid ? "border-danger bg-danger-pale" : "border-line"}`;

  return (
    <form action={formAction} noValidate>
      {state.status !== "idle" && (
        <div className="mb-5">
          <Alert tone={locked ? "locked" : "error"} title={state.message}>
            {state.detail}
          </Alert>
        </div>
      )}

      <div className="mb-5">
        <label htmlFor="email" className="mb-2 block text-sm font-semibold">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="you@moghultt.com"
          defaultValue={state.email}
          disabled={locked}
          aria-invalid={invalid || undefined}
          className={inputClass}
        />
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="mb-2 block text-sm font-semibold">
          Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          disabled={locked}
          aria-invalid={invalid || undefined}
          className={inputClass}
        />
        <p className="mt-2 text-right">
          <Link href="/admin/forgot-password" className="text-sm font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>

      <button
        type="submit"
        disabled={pending || locked}
        className="w-full rounded-lg bg-accent px-5 py-[15px] text-[17px] font-bold text-white hover:bg-accent-dark disabled:bg-line disabled:text-muted"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {locked && (
        <p className="mt-3.5 text-center text-[13px] text-muted">
          Need urgent access? Contact your Master Admin.
        </p>
      )}
    </form>
  );
}

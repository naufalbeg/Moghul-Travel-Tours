"use client";

import { useActionState } from "react";
import { FieldError } from "@/components/admin/field";
import { Alert } from "@/components/ui/alert";
import { PasswordInput } from "@/components/ui/password-input";
import { PASSWORD_HINT } from "@/lib/validation/password";
import { setPasswordWithToken, type SetPasswordState } from "./actions";

export function SetPasswordForm({ token, submitLabel }: { token: string; submitLabel: string }) {
  const [state, formAction, pending] = useActionState<SetPasswordState, FormData>(
    setPasswordWithToken.bind(null, token),
    { status: "idle" },
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const input = (error?: string) =>
    `w-full rounded-lg border-[1.5px] px-4 py-3.5 text-base focus:border-primary focus:outline-none ${
      error ? "border-danger bg-danger-pale" : "border-line"
    }`;

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.status === "error" && <Alert tone="error" title={state.message} />}
      <div>
        <label htmlFor="newPassword" className="mb-2 block text-sm font-semibold">
          New password
        </label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          aria-describedby="newPassword-hint"
          aria-invalid={errors?.newPassword ? true : undefined}
          className={input(errors?.newPassword)}
        />
        <p id="newPassword-hint" className="mt-1.5 text-[13px] text-muted">
          {PASSWORD_HINT}
        </p>
        <FieldError id="newPassword-error" message={errors?.newPassword} />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold">
          Type it again
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          aria-invalid={errors?.confirmPassword ? true : undefined}
          className={input(errors?.confirmPassword)}
        />
        <FieldError id="confirmPassword-error" message={errors?.confirmPassword} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent px-5 py-[15px] text-[17px] font-bold text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { FieldError } from "@/components/admin/field";
import { PasswordRules } from "@/components/admin/password-rules";
import { Alert } from "@/components/ui/alert";
import { PasswordInput } from "@/components/ui/password-input";
import { setPasswordWithToken, type SetPasswordState } from "./actions";

export function SetPasswordForm({ token, submitLabel }: { token: string; submitLabel: string }) {
  const [state, formAction, pending] = useActionState<SetPasswordState, FormData>(
    setPasswordWithToken.bind(null, token),
    { status: "idle" },
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const [newPassword, setNewPassword] = useState("");
  const input = (error?: string) =>
    `w-full rounded-lg border-[1.5px] px-4 py-3.5 text-base ${
      error ? "border-danger bg-danger-pale" : "border-field"
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
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <PasswordRules id="newPassword-hint" value={newPassword} />
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
        className="w-full rounded-lg bg-accent px-5 py-[15px] text-body font-bold text-ink transition-[background-color,transform] duration-150 ease-smooth hover:bg-accent-hover active:translate-y-px disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

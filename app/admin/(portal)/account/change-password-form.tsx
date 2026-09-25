"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { AlertCircleIcon } from "@/components/ui/icons";
import { PasswordInput } from "@/components/ui/password-input";
import { changePassword, type ChangePasswordState } from "./actions";

const fields = [
  { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
  {
    name: "newPassword",
    label: "New password",
    autoComplete: "new-password",
    hint: "At least 8 characters, with a number and a special character (e.g. ! @ # $).",
  },
  { name: "confirmPassword", label: "Confirm new password", autoComplete: "new-password" },
] as const;

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(
    changePassword,
    { status: "idle" },
  );
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.status === "success" && (
        <Alert tone="success" title="Password updated.">
          Use your new password the next time you sign in.
        </Alert>
      )}
      {state.status === "error" && <Alert tone="error" title={state.message} />}

      {fields.map((field) => {
        const error = fieldErrors?.[field.name];
        const describedBy = [
          "hint" in field ? `${field.name}-hint` : null,
          error ? `${field.name}-error` : null,
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="mb-2 block text-sm font-semibold">
              {field.label}
            </label>
            <PasswordInput
              id={field.name}
              name={field.name}
              autoComplete={field.autoComplete}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy || undefined}
              className={`w-full rounded-lg border-[1.5px] px-3.5 py-3 text-[15px] focus:border-primary focus:outline-none ${
                error ? "border-danger bg-danger-pale" : "border-line"
              }`}
            />
            {"hint" in field && (
              <p id={`${field.name}-hint`} className="mt-1.5 text-[13px] text-muted">
                {field.hint}
              </p>
            )}
            {error && (
              <p
                id={`${field.name}-error`}
                className="mt-2 flex items-center gap-1.5 text-[13.5px] font-semibold text-danger"
              >
                <AlertCircleIcon className="size-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>
        );
      })}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-6 py-3 font-bold text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

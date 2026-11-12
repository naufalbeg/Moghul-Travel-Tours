"use client";

import { useActionState, useState } from "react";
import { PasswordRules } from "@/components/admin/password-rules";
import { Alert } from "@/components/ui/alert";
import { AlertCircleIcon } from "@/components/ui/icons";
import { PasswordInput } from "@/components/ui/password-input";
import { changePassword, type ChangePasswordState } from "./actions";

const fields = [
  { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
  { name: "newPassword", label: "New password", autoComplete: "new-password", rules: true },
  { name: "confirmPassword", label: "Confirm new password", autoComplete: "new-password" },
] as const;

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(
    changePassword,
    { status: "idle" },
  );
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;
  const [newPassword, setNewPassword] = useState("");

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
          "rules" in field ? `${field.name}-hint` : null,
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
              onChange={"rules" in field ? (e) => setNewPassword(e.target.value) : undefined}
              className={`w-full rounded-lg border-[1.5px] px-3.5 py-3 text-meta ${
                error ? "border-danger bg-danger-pale" : "border-field"
              }`}
            />
            {"rules" in field && <PasswordRules id={`${field.name}-hint`} value={newPassword} />}
            {error && (
              <p
                id={`${field.name}-error`}
                className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-danger"
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
        className="min-h-12 rounded-lg bg-accent px-6 font-bold text-ink transition-[background-color,transform] duration-150 ease-smooth hover:bg-accent-hover active:translate-y-px disabled:opacity-60"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

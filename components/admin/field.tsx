import type { ReactNode } from "react";
import { AlertCircleIcon } from "@/components/ui/icons";

/** Input styling shared by the admin forms; red when the field has an error. */
export const fieldClass = (error?: string) =>
  `w-full rounded-lg border-[1.5px] px-3.5 py-3 text-[15px] text-ink focus:border-primary focus:outline-none ${
    error ? "border-danger bg-danger-pale" : "border-line bg-white"
  }`;

/** aria-describedby value for a field with an optional hint and error. */
export const describedBy = (id: string, hint?: string, error?: string) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

/** Label + control + hint + inline error, matching mockup 3.2.5. */
export function Field({
  id,
  label,
  optional,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-[13.5px] font-semibold text-danger">
      <AlertCircleIcon className="size-3.5 shrink-0" />
      {message}
    </p>
  );
}

/** Standard admin list-page header: title, subtitle, primary action. */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="mb-1 text-[23px]">{title}</h2>
        <p className="text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export const primaryButton =
  "flex min-h-12 items-center justify-center gap-2 self-start rounded-lg bg-accent px-5 font-bold whitespace-nowrap text-white hover:bg-accent-dark disabled:bg-line disabled:text-muted";

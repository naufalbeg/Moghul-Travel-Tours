"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";

export type ActionResult = { ok: boolean; message?: string };

const triggerStyles = {
  danger: "border-danger-line text-danger hover:bg-danger-pale",
  neutral: "border-field text-ink hover:border-primary",
} as const;

/**
 * A button that asks "are you sure?" in a dialog before running a server
 * action (SRS: destructive actions need confirmation). Pass the action
 * pre-bound, e.g. `action={deleteTestimonial.bind(null, id)}`.
 */
export function ConfirmActionButton({
  label,
  icon,
  title,
  children,
  confirmLabel,
  action,
  tone = "danger",
}: {
  label: string;
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  action: () => Promise<ActionResult>;
  tone?: keyof typeof triggerStyles;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const titleId = `confirm-${label}-${title}`.replace(/\W+/g, "-");

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) dialogRef.current?.close();
      else setError(result.message ?? "Something went wrong. Please try again.");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={`flex min-h-9 items-center gap-1.5 rounded-lg border bg-white px-3 text-sm font-semibold transition-colors duration-150 ease-smooth active:translate-y-px ${triggerStyles[tone]}`}
      >
        {icon}
        {label}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-[440px] rounded-xl p-0 shadow-dialog backdrop:bg-navy/55"
      >
        <div className="p-6">
          <h2 id={titleId} className="mb-2 text-xl text-primary-dark">
            {title}
          </h2>
          <div className="text-meta text-muted">{children}</div>
          {error && <p className="mt-3 text-sm font-semibold text-danger">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-11 rounded-lg border-[1.5px] border-field px-5 font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={run}
            disabled={pending}
            className={`min-h-11 rounded-lg px-5 font-bold text-white disabled:opacity-60 ${
              tone === "danger" ? "bg-danger" : "bg-primary"
            }`}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}

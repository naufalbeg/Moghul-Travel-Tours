"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { inviteAdmin, resendInvite, type InviteResult } from "@/app/admin/(portal)/users/actions";
import { Field, describedBy, fieldClass } from "@/components/admin/field";
import { Alert } from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircleIcon, CloseIcon, PlusIcon } from "@/components/ui/icons";

const dialogClass =
  "m-auto w-[calc(100%-2rem)] max-w-[460px] rounded-[14px] p-0 shadow-[0_24px_60px_rgba(13,44,78,0.35)] backdrop:bg-navy/55";

/** What happened after sending an invitation: emailed, or here's the link to share. */
function InviteOutcome({ result, onDone }: { result: Extract<InviteResult, { ok: true }>; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="p-6 sm:p-[26px]">
      {result.emailSent ? (
        <>
          <CheckCircleIcon className="mb-3 size-10 text-success" />
          <h3 className="mb-2 text-xl text-primary-dark">Invitation sent</h3>
          <p className="mb-6 text-[15px] text-muted">
            {result.name} will get an email at <strong className="text-ink">{result.email}</strong> with a link to set
            their password. The link expires in 24 hours.
          </p>
        </>
      ) : (
        <>
          <AlertCircleIcon className="mb-3 size-10 text-accent-dark" />
          <h3 className="mb-2 text-xl text-primary-dark">Send them this link yourself</h3>
          <p className="mb-4 text-[15px] text-muted">
            The account for <strong className="text-ink">{result.name}</strong> is ready, but the email couldn&apos;t be
            sent (the email service can&apos;t reach other addresses yet). Copy this link and send it to them on
            WhatsApp — it works once and expires in 24 hours.
          </p>
          <div className="mb-4 rounded-lg border border-line bg-canvas p-3 text-[13px] break-all text-ink">{result.link}</div>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(result.link!);
              setCopied(true);
            }}
            className="mb-4 min-h-11 w-full rounded-lg border-[1.5px] border-primary font-bold text-primary"
          >
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </>
      )}
      <button type="button" onClick={onDone} className="min-h-11 w-full rounded-lg bg-accent font-bold text-white">
        Done
      </button>
    </div>
  );
}

/** AddAdminModal [PKG-MTT-001-004] — mockup 3.1.7. */
export function AddAdminButton() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<InviteResult, { ok: true }> | null>(null);
  const [pending, startTransition] = useTransition();

  function open() {
    setValues({ name: "", email: "" });
    setErrors({});
    setMessage(null);
    setResult(null);
    dialogRef.current?.showModal();
  }
  const close = () => dialogRef.current?.close();

  function submit() {
    startTransition(async () => {
      const r = await inviteAdmin(values);
      if (r.ok) {
        setResult(r);
        router.refresh();
      } else {
        setErrors(r.errors ?? {});
        setMessage(r.message);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="flex min-h-12 items-center justify-center gap-2 self-start rounded-lg bg-accent px-5 font-bold whitespace-nowrap text-white hover:bg-accent-dark"
      >
        <PlusIcon className="size-[18px]" />
        Add new admin
      </button>

      <dialog ref={dialogRef} aria-labelledby="add-admin-title" className={dialogClass}>
        {result ? (
          <InviteOutcome result={result} onDone={close} />
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="flex items-start justify-between px-6 pt-6 sm:px-[26px]">
              <div>
                <h3 id="add-admin-title" className="mb-1.5 text-xl text-primary-dark">
                  Add new admin
                </h3>
                <p className="text-[14.5px] text-muted">Invite a staff member to access the admin dashboard.</p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="ml-3 flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-canvas">
                <CloseIcon className="size-[18px]" />
              </button>
            </div>

            <div className="space-y-[18px] px-6 py-[22px] sm:px-[26px]">
              {message && <Alert tone="error" title={message} />}
              <Field id="staff-name" label="Full name" error={errors.name}>
                <input
                  id="staff-name"
                  value={values.name}
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                  placeholder="e.g. Nurul Huda binti Rahman"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={describedBy("staff-name", undefined, errors.name)}
                  className={fieldClass(errors.name)}
                />
              </Field>
              <Field id="staff-email" label="Email address" error={errors.email}>
                <input
                  id="staff-email"
                  type="email"
                  value={values.email}
                  onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                  placeholder="staff@moghultt.com or Gmail address"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={describedBy("staff-email", undefined, errors.email)}
                  className={fieldClass(errors.email)}
                />
              </Field>
              <div className="flex rounded-[10px] bg-primary-pale px-4 py-3.5">
                <AlertCircleIcon className="mt-px mr-3 size-[18px] shrink-0 text-primary" />
                <p className="text-[13.5px] leading-normal text-primary-dark">
                  They&apos;ll receive an email with a secure link to set their own password.{" "}
                  <strong>The link expires in 24 hours</strong> — you can resend it from this page if it lapses.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6 sm:px-[26px]">
              <button type="button" onClick={close} className="min-h-11 rounded-lg border-[1.5px] border-line px-5 font-semibold">
                Cancel
              </button>
              <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-accent px-5 font-bold text-white disabled:opacity-60">
                {pending ? "Sending…" : "Send invitation"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}

/** SRS A1: re-send an invitation whose link lapsed (or was lost). */
export function ResendInviteButton({ userId }: { userId: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [pending, startTransition] = useTransition();

  function resend() {
    startTransition(async () => {
      const r = await resendInvite(userId);
      setResult(r);
      dialogRef.current?.showModal();
      if (r.ok) router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={resend}
        disabled={pending}
        className="flex min-h-9 items-center rounded-[7px] border border-line bg-white px-3 text-[13.5px] font-semibold hover:border-primary disabled:opacity-60"
      >
        {pending ? "Sending…" : "Resend invite"}
      </button>
      <dialog ref={dialogRef} aria-label="Invitation" className={dialogClass}>
        {result?.ok ? (
          <InviteOutcome result={result} onDone={() => dialogRef.current?.close()} />
        ) : (
          result && (
            <div className="p-6">
              <Alert tone="error" title={result.message} />
              <button type="button" onClick={() => dialogRef.current?.close()} className="mt-5 min-h-11 w-full rounded-lg border-[1.5px] border-line font-semibold">
                Close
              </button>
            </div>
          )
        )}
      </dialog>
    </>
  );
}

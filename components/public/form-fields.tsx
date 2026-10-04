"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import type { RefObject } from "react";
import { useI18n } from "@/components/public/i18n-provider";
import { AlertCircleIcon } from "@/components/ui/icons";
import type { FormErrorCode } from "@/lib/validation/inquiry";

// Pieces shared by the public inquiry and booking forms, so both look and
// check the same.

const SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";

export const inputClass = (error?: string) =>
  `w-full rounded-lg border-[1.5px] px-4 py-3.5 text-[17px] text-ink focus:border-primary focus:outline-none ${
    error ? "border-danger bg-danger-pale" : "border-line bg-white"
  }`;

export function InlineError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-[15px] font-semibold text-danger">
      <AlertCircleIcon className="size-4 shrink-0" />
      {message}
    </p>
  );
}

/** Error code → sentence in the visitor's language. */
export function useErrorText() {
  const { t } = useI18n();
  return (code?: FormErrorCode) => (code ? (t.formErrors[code] ?? t.formErrors.invalid) : undefined);
}

type ContactKey = "fullName" | "phone" | "email";

/** Name (full width), then phone and email side by side. Place inside a 2-column grid. */
export function ContactFields({
  values,
  errors,
  onChange,
  idPrefix = "",
}: {
  values: Record<ContactKey, string>;
  errors: Partial<Record<ContactKey, FormErrorCode>>;
  onChange: (key: ContactKey, value: string) => void;
  /** Keeps ids unique if two forms ever share a page. */
  idPrefix?: string;
}) {
  const { t } = useI18n();
  const say = useErrorText();
  const field = (key: ContactKey) => ({
    id: `${idPrefix}${key}`,
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(key, e.target.value),
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `${idPrefix}${key}-error` : undefined,
    className: inputClass(errors[key]),
  });

  return (
    <>
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}fullName`} className="mb-2 block font-semibold">
          {t.inquiry.fullName}
        </label>
        <input {...field("fullName")} autoComplete="name" />
        <InlineError id={`${idPrefix}fullName-error`} message={say(errors.fullName)} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}phone`} className="mb-2 block font-semibold">
          {t.inquiry.phone}
        </label>
        <input {...field("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="012-345 6789" />
        <InlineError id={`${idPrefix}phone-error`} message={say(errors.phone)} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}email`} className="mb-2 block font-semibold">
          {t.inquiry.email}
        </label>
        <input {...field("email")} type="email" autoComplete="email" placeholder={t.inquiry.emailPlaceholder} />
        <InlineError id={`${idPrefix}email-error`} message={say(errors.email)} />
      </div>
    </>
  );
}

/** The "I am human" box, in the visitor's language. Tokens are single-use — reset via captchaRef after a failed send. */
export function CaptchaField({
  captchaRef,
  onToken,
  error,
  id = "captcha-error",
}: {
  captchaRef: RefObject<HCaptcha | null>;
  onToken: (token: string | null) => void;
  error?: FormErrorCode;
  id?: string;
}) {
  const { locale } = useI18n();
  const say = useErrorText();
  return (
    <>
      <HCaptcha
        ref={captchaRef}
        sitekey={SITE_KEY}
        languageOverride={locale}
        onVerify={(token) => onToken(token)}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
      />
      <InlineError id={id} message={say(error)} />
    </>
  );
}

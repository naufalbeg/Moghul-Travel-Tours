"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { submitInquiry } from "@/app/(public)/inquire/actions";
import { useI18n } from "@/components/public/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircleIcon, WhatsAppIcon } from "@/components/ui/icons";
import { fmt } from "@/lib/i18n/config";
import {
  GENERAL_INQUIRY,
  validateInquiry,
  type InquiryBannerCode,
  type InquiryErrorCode,
  type InquiryErrors,
  type InquiryInput,
} from "@/lib/validation/inquiry";

const SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";

const inputClass = (error?: string) =>
  `w-full rounded-lg border-[1.5px] px-4 py-3.5 text-[17px] text-ink focus:border-primary focus:outline-none ${
    error ? "border-danger bg-danger-pale" : "border-line bg-white"
  }`;

function InlineError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-[15px] font-semibold text-danger">
      <AlertCircleIcon className="size-4 shrink-0" />
      {message}
    </p>
  );
}

/**
 * InquiryFormPage [PKG-MTT-003-001] — mockup-free, following the site's
 * form style. Figures 3.3.1 (form), 3.3.2 (success), 3.3.5 (errors).
 */
export function InquiryForm({
  packages,
  initialPackage,
  whatsappUrl,
}: {
  packages: string[];
  initialPackage: string;
  whatsappUrl: string;
}) {
  const { locale, t } = useI18n();
  const text = t.inquiry;
  /** Error code → sentence in the visitor's language. */
  const say = (code?: InquiryErrorCode) => (code ? (text.errors[code] ?? text.errors.invalid) : undefined);
  const [values, setValues] = useState<InquiryInput>({
    fullName: "",
    phone: "",
    email: "",
    packageInterest: initialPackage,
    message: "",
  });
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [banner, setBanner] = useState<InquiryBannerCode | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const captchaRef = useRef<HCaptcha>(null);

  const set = (key: keyof InquiryInput, value: string) => setValues((v) => ({ ...v, [key]: value }));

  function fail(found: InquiryErrors, message: InquiryBannerCode) {
    setErrors(found);
    setBanner(message);
    document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function submit() {
    const check = validateInquiry(values);
    const found: InquiryErrors = check.ok ? {} : { ...check.errors };
    if (!token) found.captcha = "captcha";
    if (Object.keys(found).length) return fail(found, "checkFields");

    startTransition(async () => {
      const result = await submitInquiry(values, token);
      if (result.ok) {
        setSentTo(values.fullName.trim());
        return;
      }
      // hCaptcha tokens are single-use: get a fresh one for the next try.
      captchaRef.current?.resetCaptcha();
      setToken(null);
      fail(result.errors ?? {}, result.message);
    });
  }

  if (sentTo) {
    return (
      <div role="status" className="rounded-xl border border-line bg-white px-6 py-10 text-center sm:px-10">
        <CheckCircleIcon className="mx-auto mb-4 size-14 text-success" />
        <h2 className="mb-2 text-2xl text-primary-dark">{fmt(text.thanks, { name: sentTo })}</h2>
        <p className="mx-auto mb-7 max-w-[460px] text-[17px] text-muted">
          {text.submitted}
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#1f9d55] px-6 font-bold text-white"
          >
            <WhatsAppIcon className="size-5" />
            {text.faster}
          </a>
          <Link
            href="/packages"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border-[1.5px] border-primary px-6 font-bold text-primary"
          >
            {text.browseMore}
          </Link>
        </div>
      </div>
    );
  }

  const describe = (key: keyof InquiryErrors) => (errors[key] ? `${key}-error` : undefined);

  return (
    <form
      id="inquiry-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="scroll-mt-6 rounded-xl border border-line bg-white px-5 py-7 sm:px-8"
    >
      {banner && (
        <div className="mb-6">
          <Alert tone="error" title={text.banners[banner]} />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="fullName" className="mb-2 block font-semibold">
            {text.fullName}
          </label>
          <input
            id="fullName"
            autoComplete="name"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={describe("fullName")}
            className={inputClass(errors.fullName)}
          />
          <InlineError id="fullName-error" message={say(errors.fullName)} />
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block font-semibold">
            {text.phone}
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="012-345 6789"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describe("phone")}
            className={inputClass(errors.phone)}
          />
          <InlineError id="phone-error" message={say(errors.phone)} />
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block font-semibold">
            {text.email}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={text.emailPlaceholder}
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describe("email")}
            className={inputClass(errors.email)}
          />
          <InlineError id="email-error" message={say(errors.email)} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="packageInterest" className="mb-2 block font-semibold">
            {text.packageInterest}
          </label>
          <select
            id="packageInterest"
            value={values.packageInterest}
            onChange={(e) => set("packageInterest", e.target.value)}
            aria-invalid={Boolean(errors.packageInterest)}
            aria-describedby={describe("packageInterest")}
            className={inputClass(errors.packageInterest)}
          >
            <option value={GENERAL_INQUIRY}>{text.general}</option>
            {packages.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
          <InlineError id="packageInterest-error" message={say(errors.packageInterest)} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-2 block font-semibold">
            {text.message} <span className="font-normal text-muted">{text.optional}</span>
          </label>
          <textarea
            id="message"
            rows={5}
            placeholder={text.messagePlaceholder}
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={describe("message")}
            className={`${inputClass(errors.message)} resize-y leading-relaxed`}
          />
          <InlineError id="message-error" message={say(errors.message)} />
        </div>

        <div className="sm:col-span-2">
          <HCaptcha
            ref={captchaRef}
            sitekey={SITE_KEY}
            languageOverride={locale}
            onVerify={(t) => {
              setToken(t);
              setErrors((e) => ({ ...e, captcha: undefined }));
            }}
            onExpire={() => setToken(null)}
            onError={() => setToken(null)}
          />
          <InlineError id="captcha-error" message={say(errors.captcha)} />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-7 min-h-14 w-full rounded-[10px] bg-accent px-6 text-lg font-bold text-white hover:bg-accent-dark disabled:opacity-60 sm:w-auto sm:min-w-60"
      >
        {pending ? text.sending : text.send}
      </button>
      <p className="mt-4 text-sm text-muted">
        {text.privacy}
      </p>
    </form>
  );
}

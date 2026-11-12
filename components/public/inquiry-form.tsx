"use client";

import type HCaptcha from "@hcaptcha/react-hcaptcha";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { submitInquiry } from "@/app/(public)/inquire/actions";
import { CaptchaField, ContactFields, InlineError, inputClass, labelClass, useErrorText } from "@/components/public/form-fields";
import { useI18n } from "@/components/public/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { CheckCircleIcon, WhatsAppIcon } from "@/components/ui/icons";
import { fmt } from "@/lib/i18n/config";
import {
  GENERAL_INQUIRY,
  validateInquiry,
  type FormBannerCode,
  type InquiryErrors,
  type InquiryInput,
} from "@/lib/validation/inquiry";

/**
 * InquiryFormPage [PKG-MTT-003-001], in the site's form style. Figures 3.3.1 (form), 3.3.2 (success), 3.3.5 (errors).
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
  const { t } = useI18n();
  const text = t.inquiry;
  const say = useErrorText();
  const [values, setValues] = useState<InquiryInput>({
    fullName: "",
    phone: "",
    email: "",
    packageInterest: initialPackage,
    message: "",
  });
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [banner, setBanner] = useState<FormBannerCode | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const captchaRef = useRef<HCaptcha>(null);

  const set = (key: keyof InquiryInput, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function fail(found: InquiryErrors, message: FormBannerCode) {
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
      <div role="status" className="appear rounded-xl border border-line bg-white px-6 py-10 sm:px-10">
        <CheckCircleIcon className="mb-4 size-14 text-success" />
        <h2 className="mb-2 text-display font-extrabold text-primary-dark">{fmt(text.thanks, { name: sentTo })}</h2>
        <p className="mb-7 max-w-[52ch] text-muted">{text.submitted}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-wa">
            <WhatsAppIcon className="size-[22px]" />
            {text.faster}
          </a>
          <Link href="/packages" className="btn btn-outline">
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
      className="rounded-xl border border-line bg-white px-5 py-7 sm:px-8"
    >
      {banner && (
        <div className="mb-6">
          <Alert tone="error" title={t.formBanners[banner]} />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <ContactFields values={values} errors={errors} onChange={set} />

        <div className="sm:col-span-2">
          <label htmlFor="packageInterest" className={labelClass}>
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
          <label htmlFor="message" className={labelClass}>
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
          <CaptchaField
            captchaRef={captchaRef}
            error={errors.captcha}
            onToken={(next) => {
              setToken(next);
              if (next) setErrors((e) => ({ ...e, captcha: undefined }));
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className="btn btn-accent btn-lg mt-7 w-full sm:w-auto sm:min-w-60"
      >
        {pending && <span className="spinner" aria-hidden="true" />}
        {pending ? text.sending : text.send}
      </button>
      <p className="mt-4 text-fine text-muted">
        {text.privacy}{" "}
        <Link href="/privacy" className="text-link font-normal">
          {text.privacyLink}
        </Link>
      </p>
    </form>
  );
}

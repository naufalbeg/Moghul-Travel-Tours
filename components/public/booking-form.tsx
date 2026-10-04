"use client";

import type HCaptcha from "@hcaptcha/react-hcaptcha";
import { useRef, useState, useTransition } from "react";
import { submitBooking } from "@/app/(public)/packages/[slug]/actions";
import { CaptchaField, ContactFields, InlineError, inputClass, useErrorText } from "@/components/public/form-fields";
import { useI18n } from "@/components/public/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { CheckCircleIcon, WhatsAppIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/format";
import { fmt } from "@/lib/i18n/config";
import { whatsappHref } from "@/lib/site-content";
import { MAX_PAX_PER_OPTION, validateBooking, type BookingErrors } from "@/lib/validation/booking";
import type { FormBannerCode } from "@/lib/validation/inquiry";

export type BookingDeparture = { date: string; label: string; availability: "OPEN" | "ALMOST_FULL" | "FULL" };
/** One price the customer can pick travellers for, e.g. Dewasa, Bilik Twin. */
export type BookingOption = { key: string; label: string; hint: string | null; amount: number };

const stepButton =
  "flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary text-xl font-bold text-primary hover:bg-primary-pale disabled:border-line disabled:text-line disabled:hover:bg-transparent";

/**
 * "Borang Tempahan" at the bottom of a package page (like jomventures.my):
 * contact details, departure date, how many travellers per price, a running
 * estimated total, notes. Sends a booking request — the team confirms the
 * place and payment with the customer afterwards.
 */
export function BookingForm({
  slug,
  title,
  departures,
  options,
  whatsapp,
}: {
  slug: string;
  title: string;
  departures: BookingDeparture[];
  options: BookingOption[];
  whatsapp: string;
}) {
  const { t } = useI18n();
  const text = t.booking;
  const say = useErrorText();
  const open = departures.filter((d) => d.availability !== "FULL");

  const [contact, setContact] = useState({ fullName: "", phone: "", email: "" });
  // One open date? Pick it — one less step.
  const [departureDate, setDepartureDate] = useState(open.length === 1 ? open[0].date : "");
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(options.map((o) => [o.key, 0])),
  );
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<BookingErrors>({});
  const [banner, setBanner] = useState<FormBannerCode | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sent, setSent] = useState<{ name: string; date: string; travellers: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const captchaRef = useRef<HCaptcha>(null);

  const setCount = (key: string, value: number) => {
    setCounts((c) => ({ ...c, [key]: Math.min(MAX_PAX_PER_OPTION, Math.max(0, Math.trunc(value) || 0)) }));
    setErrors((e) => ({ ...e, travellers: undefined }));
  };

  const lines = options.filter((o) => counts[o.key] > 0).map((o) => ({ ...o, count: counts[o.key] }));
  const total = lines.reduce((sum, l) => sum + l.count * l.amount, 0);
  const travellersText = lines.map((l) => fmt(text.line, { n: l.count, option: l.label })).join(", ");

  function fail(found: BookingErrors, message: FormBannerCode) {
    setErrors(found);
    setBanner(message);
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function submit() {
    const input = { ...contact, departureDate, travellers: counts, message };
    const check = validateBooking(input);
    const found: BookingErrors = check.ok ? {} : { ...check.errors };
    if (!token) found.captcha = "captcha";
    if (Object.keys(found).length) return fail(found, "checkFields");

    startTransition(async () => {
      const result = await submitBooking(slug, input, token);
      if (result.ok) {
        const date = departures.find((d) => d.date === departureDate)?.label ?? departureDate;
        setSent({ name: contact.fullName.trim(), date, travellers: travellersText });
        document.getElementById("tempahan")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      // hCaptcha tokens are single-use: get a fresh one for the next try.
      captchaRef.current?.resetCaptcha();
      setToken(null);
      fail(result.errors ?? {}, result.message);
    });
  }

  if (sent) {
    return (
      <div role="status" className="rounded-xl border border-line bg-white px-6 py-10 text-center sm:px-10">
        <CheckCircleIcon className="mx-auto mb-4 size-14 text-success" />
        <h3 className="mb-2 text-2xl text-primary-dark">{fmt(text.thanks, { name: sent.name })}</h3>
        <p className="mx-auto mb-7 max-w-[480px] text-[17px] text-muted">
          {fmt(text.received, { package: title, date: sent.date })}
        </p>
        <a
          href={whatsappHref(
            { whatsapp },
            fmt(text.whatsappMessage, { package: title, date: sent.date, travellers: sent.travellers }),
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#1f9d55] px-6 font-bold text-white"
        >
          <WhatsAppIcon className="size-5" />
          {text.whatsapp}
        </a>
      </div>
    );
  }

  return (
    <form
      id="booking-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="scroll-mt-6 rounded-xl border border-line bg-white px-5 py-7 sm:px-8"
    >
      {banner && (
        <div className="mb-6">
          <Alert tone="error" title={t.formBanners[banner]} />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <ContactFields
          idPrefix="booking-"
          values={contact}
          errors={errors}
          onChange={(key, value) => {
            setContact((c) => ({ ...c, [key]: value }));
            setErrors((e) => ({ ...e, [key]: undefined }));
          }}
        />

        <div className="sm:col-span-2">
          <label htmlFor="booking-departure" className="mb-2 block font-semibold">
            {text.departure}
          </label>
          <select
            id="booking-departure"
            value={departureDate}
            onChange={(e) => {
              setDepartureDate(e.target.value);
              setErrors((x) => ({ ...x, departureDate: undefined }));
            }}
            aria-invalid={Boolean(errors.departureDate)}
            aria-describedby={errors.departureDate ? "booking-departure-error" : undefined}
            className={inputClass(errors.departureDate)}
          >
            <option value="">{text.chooseDeparture}</option>
            {departures.map((d) => (
              <option key={d.date} value={d.date} disabled={d.availability === "FULL"}>
                {d.label}
                {d.availability === "ALMOST_FULL" && ` (${text.almostFull})`}
                {d.availability === "FULL" && ` (${text.full})`}
              </option>
            ))}
          </select>
          <InlineError id="booking-departure-error" message={say(errors.departureDate)} />
        </div>

        <fieldset className="sm:col-span-2" aria-describedby={errors.travellers ? "booking-travellers-error" : undefined}>
          <legend className="mb-1 font-semibold">{text.travellers}</legend>
          <p className="mb-2 text-[15px] text-muted">{text.travellersHint}</p>
          <ul
            className={`divide-y divide-line rounded-lg border-[1.5px] px-4 ${
              errors.travellers ? "border-danger bg-danger-pale" : "border-line"
            }`}
          >
            {options.map((o) => {
              const count = counts[o.key];
              return (
                // Phones: counter on its own line under the label, so the label isn't squeezed.
                <li
                  key={o.key}
                  className="flex flex-col gap-2.5 py-3.5 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between min-[480px]:gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{o.label}</p>
                    <p className="text-[15px] text-muted">
                      {fmt(text.perPerson, { price: formatPrice(o.amount) })}
                      {o.hint && ` · ${o.hint}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCount(o.key, count - 1)}
                      disabled={count === 0}
                      aria-label={fmt(text.decrease, { option: o.label })}
                      className={stepButton}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={MAX_PAX_PER_OPTION}
                      value={count}
                      onChange={(e) => setCount(o.key, Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      aria-label={o.label}
                      className="h-11 w-14 rounded-lg border-[1.5px] border-line bg-white text-center text-lg font-bold text-ink focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCount(o.key, count + 1)}
                      disabled={count >= MAX_PAX_PER_OPTION}
                      aria-label={fmt(text.increase, { option: o.label })}
                      className={stepButton}
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <InlineError id="booking-travellers-error" message={say(errors.travellers)} />
        </fieldset>

        {lines.length > 0 && (
          <div className="rounded-lg bg-primary-pale px-4 py-4 sm:col-span-2" aria-live="polite">
            <ul className="space-y-1.5 text-[15px]">
              {lines.map((l) => (
                <li key={l.key} className="flex justify-between gap-4">
                  <span>
                    {fmt(text.line, { n: l.count, option: l.label })}{" "}
                    <span className="text-muted">({formatPrice(l.amount)})</span>
                  </span>
                  <span className="font-semibold whitespace-nowrap">{formatPrice(l.count * l.amount)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between gap-4 border-t border-primary/20 pt-3 text-lg font-bold text-primary-dark">
              <span>{text.total}</span>
              <span className="font-heading whitespace-nowrap">{formatPrice(total)}</span>
            </p>
            <p className="mt-1 text-sm text-muted">{text.estimateNote}</p>
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor="booking-message" className="mb-2 block font-semibold">
            {text.notes} <span className="font-normal text-muted">{t.inquiry.optional}</span>
          </label>
          <textarea
            id="booking-message"
            rows={3}
            placeholder={text.notesPlaceholder}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setErrors((x) => ({ ...x, message: undefined }));
            }}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "booking-message-error" : undefined}
            className={`${inputClass(errors.message)} resize-y leading-relaxed`}
          />
          <InlineError id="booking-message-error" message={say(errors.message)} />
        </div>

        <div className="sm:col-span-2">
          <CaptchaField
            id="booking-captcha-error"
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
        className="mt-7 min-h-14 w-full rounded-[10px] bg-accent px-6 text-lg font-bold text-white hover:bg-accent-dark disabled:opacity-60 sm:w-auto sm:min-w-64"
      >
        {pending ? text.sending : text.submit}
      </button>
      <p className="mt-4 text-[15px] font-semibold text-success">{text.noPayment}</p>
    </form>
  );
}

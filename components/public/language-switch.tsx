"use client";

import { useOptimistic, useTransition } from "react";
import { setLanguage } from "@/app/(public)/actions";
import { useI18n } from "@/components/public/i18n-provider";
import { LOCALES, type Locale } from "@/lib/i18n/config";

const SHORT: Record<Locale, string> = { ms: "BM", en: "EN" };

/**
 * "BM | EN" pill in the header. The highlight slides to the chosen language
 * straight away; the page then re-renders in that language.
 */
export function LanguageSwitch() {
  const { locale, t } = useI18n();
  const [shown, setShown] = useOptimistic(locale);
  const [, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === shown) return;
    startTransition(async () => {
      setShown(next);
      await setLanguage(next);
    });
  }

  return (
    <div
      role="group"
      aria-label={t.language.label}
      className="relative inline-flex shrink-0 rounded-full border-[1.5px] border-field bg-white p-0.5"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-primary-dark transition-transform duration-250 ease-smooth ${
          shown === "en" ? "translate-x-full" : ""
        }`}
      />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          onClick={() => choose(l)}
          aria-pressed={shown === l}
          aria-label={t.language[l]}
          title={t.language[l]}
          className={`relative min-h-11 w-10 rounded-full text-fine font-bold transition-colors duration-250 ease-smooth sm:w-[46px] ${
            shown === l ? "text-white" : "text-muted hover:text-ink"
          }`}
        >
          {SHORT[l]}
        </button>
      ))}
    </div>
  );
}

"use client";

import { createContext, use, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { ClientDictionary } from "@/lib/i18n/ms";

const I18nContext = createContext<{ locale: Locale; t: ClientDictionary } | null>(null);

/** Gives interactive components the visitor's language (set in the public layout). */
export function I18nProvider({ locale, t, children }: { locale: Locale; t: ClientDictionary; children: ReactNode }) {
  return <I18nContext value={{ locale, t }}>{children}</I18nContext>;
}

export function useI18n() {
  const context = use(I18nContext);
  if (!context) throw new Error("useI18n must be used inside <I18nProvider>");
  return context;
}

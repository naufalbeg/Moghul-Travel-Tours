import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/en";
import { ms, type Dictionary } from "@/lib/i18n/ms";

const dictionaries = { ms, en } satisfies Record<string, Dictionary>;

/** The visitor's language: their saved choice, otherwise Malay. Once per request. */
export const getLocale = cache(async () => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(saved) ? saved : DEFAULT_LOCALE;
});

/** The public-site strings in the visitor's language. */
export const getDictionary = cache(async (): Promise<Dictionary> => dictionaries[await getLocale()]);

// Public-site languages. Malay is the default for every visitor; the "BM | EN"
// switch in the header stores the choice in a cookie, so page addresses stay
// the same in both languages. Shared by server and client code.

export const LOCALES = ["ms", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ms";
export const LOCALE_COOKIE = "lang";

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

/** For Intl date/number formatting. */
export const INTL_LOCALE: Record<Locale, string> = { ms: "ms-MY", en: "en-GB" };

/** "Terima kasih, {name}!" + { name: "Aminah" } → "Terima kasih, Aminah!" */
export function fmt(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

import Form from "next/form";
import type { CSSProperties } from "react";
import { SearchSubmit } from "@/components/public/search-submit";
import { fmt } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { CATEGORY_FILTERS } from "@/lib/package-labels";
import { upcomingMonths } from "@/lib/packages";

/**
 * Homepage search: one bar of three parts (destination, departure month,
 * category) and the orange button — the styles are `.search-bar` / `.seg` in
 * app/globals.css. A GET form to /packages, so it works without JavaScript;
 * with it, the button shows "Mencari…" until the results arrive.
 *
 * `suggestions` are the places offered as the visitor types (the admin's
 * list in Content pages).
 */
export async function PackageSearch({ suggestions = [] }: { suggestions?: string[] }) {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const placeholder =
    suggestions.length >= 3
      ? fmt(t.search.destinationExamples, { places: suggestions.slice(0, 3).join(", ") })
      : t.search.destinationPlaceholder;

  return (
    <Form
      action="/packages"
      role="search"
      aria-label={t.search.label}
      className="search-bar rise"
      style={{ "--i": 4 } as CSSProperties}
    >
      <div className="seg">
        <label htmlFor="search-q">{t.search.destination}</label>
        <input
          id="search-q"
          name="q"
          type="search"
          autoComplete="off"
          placeholder={placeholder}
          list={suggestions.length > 0 ? "search-destinations" : undefined}
        />
        {suggestions.length > 0 && (
          <datalist id="search-destinations">
            {suggestions.map((place) => (
              <option key={place} value={place} />
            ))}
          </datalist>
        )}
      </div>
      <div className="seg">
        <label htmlFor="search-month">{t.search.month}</label>
        <select id="search-month" name="month" defaultValue="">
          <option value="">{t.search.anyMonth}</option>
          {upcomingMonths(locale).map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="seg">
        <label htmlFor="search-category">{t.search.category}</label>
        <select id="search-category" name="category" defaultValue="">
          <option value="">{t.search.allCategories}</option>
          {CATEGORY_FILTERS.map((f) => (
            <option key={f.slug} value={f.slug}>
              {t.categories[f.categories[0]]}
            </option>
          ))}
        </select>
      </div>
      <SearchSubmit label={t.search.submit} />
    </Form>
  );
}

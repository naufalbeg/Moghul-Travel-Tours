import Form from "next/form";
import type { CSSProperties } from "react";
import { SearchSubmit } from "@/components/public/search-submit";
import { fmt } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { CATEGORY_FILTERS } from "@/lib/package-labels";
import { upcomingMonths } from "@/lib/packages";

/**
 * Package search: one bar of labelled parts and the orange button — the
 * styles are `.search-bar` / `.seg` in app/globals.css. A GET form to
 * /packages, so it works without JavaScript; with it, the button shows
 * "Mencari…" until the results arrive.
 *
 * - Homepage: destination, departure month and category.
 * - Packages page (`category` given, even as `null` for "all"): destination
 *   and month only, filled in with the current search. The category stays
 *   with the tabs under the bar and is carried along as a hidden field.
 *
 * `suggestions` are the places offered as the visitor types (the admin's
 * list in Content pages).
 */
export async function PackageSearch({
  suggestions = [],
  query,
  month,
  category,
}: {
  suggestions?: string[];
  query?: string;
  month?: string;
  /** The Packages page's current category slug; `null` = all packages. */
  category?: string | null;
}) {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const onListing = category !== undefined;
  const placeholder =
    suggestions.length >= 3
      ? fmt(t.search.destinationExamples, { places: suggestions.slice(0, 3).join(", ") })
      : t.search.destinationPlaceholder;
  const months = upcomingMonths(locale);

  return (
    <Form
      action="/packages"
      role="search"
      aria-label={t.search.label}
      className={`search-bar rise ${onListing ? "search-bar-two" : ""}`}
      style={{ "--i": onListing ? 2 : 4 } as CSSProperties}
    >
      <div className="seg">
        <label htmlFor="search-q">{t.search.destination}</label>
        <input
          id="search-q"
          name="q"
          type="search"
          autoComplete="off"
          key={query ?? ""}
          defaultValue={query}
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
        <select
          id="search-month"
          name="month"
          defaultValue={months.some((m) => m.value === month) ? month : ""}
          key={month ?? ""}
        >
          <option value="">{t.search.anyMonth}</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      {onListing ? (
        category && <input type="hidden" name="category" value={category} />
      ) : (
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
      )}
      <SearchSubmit label={t.search.submit} />
    </Form>
  );
}

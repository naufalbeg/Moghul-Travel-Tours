import { CATEGORY_FILTERS } from "@/lib/package-labels";
import { upcomingMonths } from "@/lib/packages";

const fieldClass =
  "min-h-12 w-full rounded-lg border border-line bg-white px-3.5 text-[15px] text-ink focus:border-primary focus:outline-none";

/**
 * Hero search bar (homepage mockup). A plain GET form to /packages, so it
 * works without JavaScript.
 */
export function PackageSearch() {
  return (
    <form
      action="/packages"
      method="get"
      role="search"
      aria-label="Find a package"
      className="relative z-10 mx-auto -mt-14 grid max-w-[880px] gap-3.5 rounded-[14px] bg-white p-5 text-left shadow-[0_8px_28px_rgba(18,58,102,0.18)] sm:grid-cols-2 sm:p-6 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end"
    >
      <div>
        <label htmlFor="search-q" className="mb-1.5 block text-[13px] font-semibold text-muted">
          Destination
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          placeholder="Where would you like to go?"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="search-month" className="mb-1.5 block text-[13px] font-semibold text-muted">
          Month
        </label>
        <select id="search-month" name="month" defaultValue="" className={fieldClass}>
          <option value="">Any month</option>
          {upcomingMonths().map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="search-category" className="mb-1.5 block text-[13px] font-semibold text-muted">
          Category
        </label>
        <select id="search-category" name="category" defaultValue="" className={fieldClass}>
          <option value="">All categories</option>
          {CATEGORY_FILTERS.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="min-h-12 rounded-lg bg-accent px-8 text-base font-bold text-white hover:bg-accent-dark sm:col-span-2 lg:col-span-1"
      >
        Search
      </button>
    </form>
  );
}

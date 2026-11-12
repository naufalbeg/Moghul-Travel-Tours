import Link from "next/link";
import { tabClass, tabCountClass, tabListClass } from "@/components/ui/tabs";
import type { PackageCategory } from "@/generated/prisma/enums";
import { getDictionary } from "@/lib/i18n/server";
import { CATEGORY_FILTERS } from "@/lib/package-labels";

/**
 * Category filter on the Packages page: text tabs with the number of
 * packages in each (for the current search, which the links keep). Plain
 * links, so they work without JS. A tab right of the active one slides the
 * results in from the right, one to the left from the left.
 */
export async function CategoryTabs({
  active,
  counts,
  query,
  month,
}: {
  active: string | null;
  /** Published packages per category that match the current search. */
  counts: Partial<Record<PackageCategory, number>>;
  query?: string;
  month?: string;
}) {
  const t = await getDictionary();
  const href = (slug: string | null) => {
    const search = new URLSearchParams({
      ...(slug && { category: slug }),
      ...(query && { q: query }),
      ...(month && { month }),
    }).toString();
    return search ? `/packages?${search}` : "/packages";
  };
  const tabs = [
    { slug: null, label: t.categoryFilter.all, count: Object.values(counts).reduce((sum, n) => sum + n, 0) },
    ...CATEGORY_FILTERS.map((f) => ({
      slug: f.slug as string | null,
      label: t.categories[f.categories[0]],
      count: f.categories.reduce((sum, category) => sum + (counts[category] ?? 0), 0),
    })),
  ];

  const current = tabs.findIndex((tab) => tab.slug === active);

  return (
    <nav aria-label={t.categoryFilter.label} className={tabListClass}>
      {tabs.map((tab, i) => {
        const isActive = i === current;
        return (
          <Link
            key={tab.slug ?? "all"}
            href={href(tab.slug)}
            transitionTypes={isActive ? undefined : [i > current ? "nav-forward" : "nav-back"]}
            aria-current={isActive ? "page" : undefined}
            className={tabClass(isActive)}
          >
            {tab.label}
            <span className={tabCountClass}>{tab.count}</span>
          </Link>
        );
      })}
    </nav>
  );
}

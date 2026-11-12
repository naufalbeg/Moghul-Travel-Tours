import Link from "next/link";
import { pillClass } from "@/components/public/pill";
import { getDictionary } from "@/lib/i18n/server";
import { CATEGORY_FILTERS } from "@/lib/package-labels";

/**
 * Category filter pills on the Packages page. Plain links, so they work
 * without JS. A pill right of the active one slides the results in from the
 * right, one to the left from the left.
 */
export async function CategoryPills({ active }: { active: string | null }) {
  const t = await getDictionary();
  const pills = [
    { slug: null, label: t.categoryPills.all, href: "/packages" },
    ...CATEGORY_FILTERS.map((f) => ({
      slug: f.slug,
      label: t.categories[f.categories[0]],
      href: `/packages?category=${f.slug}`,
    })),
  ];

  const current = pills.findIndex((pill) => pill.slug === active);

  return (
    <nav aria-label={t.categoryPills.label} className="flex flex-wrap gap-3">
      {pills.map((pill, i) => {
        const isActive = i === current;
        return (
          <Link
            key={pill.slug ?? "all"}
            href={pill.href}
            transitionTypes={isActive ? undefined : [i > current ? "nav-forward" : "nav-back"]}
            aria-current={isActive ? "page" : undefined}
            className={pillClass(isActive)}
          >
            {pill.label}
          </Link>
        );
      })}
    </nav>
  );
}

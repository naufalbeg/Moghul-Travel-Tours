import Link from "next/link";
import { getDictionary } from "@/lib/i18n/server";
import { CATEGORY_FILTERS } from "@/lib/package-labels";

/**
 * Category filter pills (mockup 3.2.1). Plain links, so they work without JS.
 * A pill right of the active one slides the results in from the right, one to
 * the left from the left. On the homepage (`fromHomepage`) every pill leads to
 * the Packages page, so they all slide forward like the Packages menu item.
 */
export async function CategoryPills({
  active,
  allLabel,
  fromHomepage = false,
}: {
  active: string | null;
  allLabel?: string;
  fromHomepage?: boolean;
}) {
  const t = await getDictionary();
  const pills = [
    { slug: null, label: allLabel ?? t.categoryPills.all, href: "/packages" },
    ...CATEGORY_FILTERS.map((f) => ({
      slug: f.slug,
      label: t.categories[f.categories[0]],
      href: `/packages?category=${f.slug}`,
    })),
  ];

  const current = pills.findIndex((pill) => pill.slug === active);

  return (
    <nav aria-label={t.categoryPills.label} className="flex flex-wrap justify-center gap-3">
      {pills.map((pill, i) => {
        const isActive = i === current;
        const direction = fromHomepage || i > current ? "nav-forward" : "nav-back";
        return (
          <Link
            key={pill.slug ?? "all"}
            href={pill.href}
            transitionTypes={isActive && !fromHomepage ? undefined : [direction]}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-11 items-center rounded-full border-[1.5px] border-primary px-[22px] text-[15px] font-semibold ${
              isActive ? "bg-primary text-white" : "bg-white text-primary hover:bg-primary-pale"
            }`}
          >
            {pill.label}
          </Link>
        );
      })}
    </nav>
  );
}

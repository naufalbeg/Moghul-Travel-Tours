import Link from "next/link";
import { CATEGORY_FILTERS } from "@/lib/package-labels";

/** Category filter pills (mockup 3.2.1). Plain links, so they work without JS. */
export function CategoryPills({
  active,
  allLabel = "All packages",
}: {
  active: string | null;
  allLabel?: string;
}) {
  const pills = [
    { slug: null, label: allLabel, href: "/packages" },
    ...CATEGORY_FILTERS.map((f) => ({
      slug: f.slug,
      label: f.label,
      href: `/packages?category=${f.slug}`,
    })),
  ];

  return (
    <nav aria-label="Package categories" className="flex flex-wrap justify-center gap-3">
      {pills.map((pill) => {
        const isActive = pill.slug === active;
        return (
          <Link
            key={pill.label}
            href={pill.href}
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

import type { Metadata } from "next";
import Link from "next/link";
import { CategoryTabs } from "@/components/public/category-tabs";
import { PackageGrid } from "@/components/public/package-card";
import { PackageSearch } from "@/components/public/package-search";
import { PageBanner } from "@/components/public/page-banner";
import { SlideTransition } from "@/components/public/slide-transition";
import { WhatsAppIcon } from "@/components/ui/icons";
import { getBannerImages } from "@/lib/banner-images";
import { packagesBannerKey } from "@/lib/banners";
import { formatPrice } from "@/lib/format";
import { fmt } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { resolveCategoryFilter } from "@/lib/package-labels";
import { countPublishedByCategory, listPublishedPackages, upcomingMonths } from "@/lib/packages";
import { getPublicContent } from "@/lib/site-config";
import { listItems, whatsappHref } from "@/lib/site-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: t.meta.packagesTitle,
    description: t.meta.packagesDescription,
    alternates: { canonical: "/packages" },
  };
}

function param(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

/**
 * PackageListingPage [PKG-MTT-002-001]: navy banner that says how many
 * packages there are and what they start from, the search bar across its
 * lower edge (destination and month; filled in with the current search),
 * category tabs with their counts, then the cards.
 */
export default async function PackagesPage({ searchParams }: PageProps<"/packages">) {
  const params = await searchParams;
  const filter = resolveCategoryFilter(param(params.category));
  const query = param(params.q);
  const month = param(params.month);

  const [content, packages, counts, bannerImages, t, locale] = await Promise.all([
    getPublicContent(),
    listPublishedPackages({ categories: filter?.categories, query, month }),
    countPublishedByCategory({ query, month }),
    getBannerImages(packagesBannerKey(filter?.slug)),
    getDictionary(),
    getLocale(),
  ]);

  const monthLabel = month ? upcomingMonths(locale).find((m) => m.value === month)?.label : undefined;
  const searchParts = [
    query && `“${query}”`,
    monthLabel && fmt(t.packages.departingIn, { month: monthLabel }),
  ].filter(Boolean);
  const searching = searchParts.length > 0;

  // "14 pakej, bermula dari RM 2,190 seorang." — only when there is something to count.
  const prices = packages.flatMap((p) => (p.fromPrice === null ? [] : [p.fromPrice]));
  const summary =
    packages.length > 0 && prices.length > 0
      ? fmt(packages.length === 1 ? t.packages.summaryOne : t.packages.summary, {
          n: packages.length,
          price: formatPrice(Math.min(...prices)),
        })
      : t.packages.subtitle;

  // Switching category re-keys the banner and results, so they slide like a
  // page change while the search bar and tabs stay put (see CategoryTabs).
  const view = filter?.slug ?? "all";

  return (
    <>
      <SlideTransition key={view}>
        <PageBanner
          title={filter ? fmt(t.packages.categoryTitle, { category: t.categories[filter.categories[0]] }) : t.packages.title}
          images={bannerImages}
          overlap
        >
          {searching ? t.packages.subtitle : summary}
        </PageBanner>
      </SlideTransition>

      <div className="relative z-[2] -mt-11">
        <div className="wrap">
          <PackageSearch
            suggestions={listItems(content.search_destinations)}
            query={query}
            month={month}
            category={filter?.slug ?? null}
          />
        </div>
      </div>

      <section className="wrap pt-8 pb-[clamp(56px,7vw,104px)]">
        <div className="mb-8">
          <CategoryTabs active={filter?.slug ?? null} counts={counts} query={query} month={month} />
        </div>

        <SlideTransition key={view}>
          <div>
            {searching && (
              <p className="mb-6 text-muted" role="status">
                <strong className="text-ink">
                  {packages.length === 1 ? t.packages.foundOne : fmt(t.packages.found, { n: packages.length })}
                </strong>
                {" · "}
                {fmt(t.packages.matching, { terms: searchParts.join(", ") })}{" "}
                <Link href={filter ? `/packages?category=${filter.slug}` : "/packages"} className="text-link">
                  {t.packages.clearSearch}
                </Link>
              </p>
            )}

            {packages.length > 0 ? (
              <PackageGrid packages={packages} heading="h2" />
            ) : (
              <div className="max-w-[60ch] rounded-xl border border-line bg-white px-6 py-8">
                <h2 className="mb-2 text-title text-primary-dark">{t.packages.noneTitle}</h2>
                <p className="mb-6 text-muted">{searching || filter ? t.packages.noneFiltered : t.packages.noneYet}</p>
                <a
                  href={whatsappHref(content, t.whatsapp.askPackages)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-wa"
                >
                  <WhatsAppIcon className="size-[22px]" />
                  {t.home.askWhatsApp}
                </a>
              </div>
            )}
          </div>
        </SlideTransition>
      </section>
    </>
  );
}

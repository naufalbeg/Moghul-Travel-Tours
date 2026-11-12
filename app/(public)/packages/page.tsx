import type { Metadata } from "next";
import Link from "next/link";
import { CategoryPills } from "@/components/public/category-pills";
import { PackageGrid } from "@/components/public/package-card";
import { PageBanner } from "@/components/public/page-banner";
import { SlideTransition } from "@/components/public/slide-transition";
import { WhatsAppIcon } from "@/components/ui/icons";
import { getBannerImages } from "@/lib/banner-images";
import { packagesBannerKey } from "@/lib/banners";
import { fmt } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { resolveCategoryFilter } from "@/lib/package-labels";
import { listPublishedPackages, upcomingMonths } from "@/lib/packages";
import { getPublicContent } from "@/lib/site-config";
import { whatsappHref } from "@/lib/site-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.meta.packagesTitle, description: t.meta.packagesDescription };
}

function param(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

/** PackageListingPage [PKG-MTT-002-001]: navy banner, category pills, the cards. */
export default async function PackagesPage({ searchParams }: PageProps<"/packages">) {
  const params = await searchParams;
  const filter = resolveCategoryFilter(param(params.category));
  const query = param(params.q);
  const month = param(params.month);

  const [content, packages, bannerImages, t, locale] = await Promise.all([
    getPublicContent(),
    listPublishedPackages({ categories: filter?.categories, query, month }),
    getBannerImages(packagesBannerKey(filter?.slug)),
    getDictionary(),
    getLocale(),
  ]);

  const monthLabel = month ? upcomingMonths(locale).find((m) => m.value === month)?.label : undefined;
  const searchParts = [
    query && `“${query}”`,
    monthLabel && fmt(t.packages.departingIn, { month: monthLabel }),
  ].filter(Boolean);

  // Switching category re-keys the banner and results, so they slide like a
  // page change while the pills stay put (see CategoryPills).
  const view = filter?.slug ?? "all";

  return (
    <>
      <SlideTransition key={view}>
        <PageBanner
          title={filter ? fmt(t.packages.categoryTitle, { category: t.categories[filter.categories[0]] }) : t.packages.title}
          images={bannerImages}
        >
          {t.packages.subtitle}
        </PageBanner>
      </SlideTransition>

      <section className="wrap pt-10 pb-[clamp(56px,7vw,104px)]">
        <div className="mb-8">
          <CategoryPills active={filter?.slug ?? null} />
        </div>

        <SlideTransition key={view}>
          <div>
            {searchParts.length > 0 && (
              <p className="mb-6 text-muted">
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
                <p className="mb-6 text-muted">
                  {searchParts.length > 0 || filter ? t.packages.noneFiltered : t.packages.noneYet}
                </p>
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

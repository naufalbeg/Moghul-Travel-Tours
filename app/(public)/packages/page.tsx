import type { Metadata } from "next";
import Link from "next/link";
import { CategoryPills } from "@/components/public/category-pills";
import { PackageGrid } from "@/components/public/package-card";
import { PageBanner } from "@/components/public/page-banner";
import { WhatsAppIcon } from "@/components/ui/icons";
import { resolveCategoryFilter } from "@/lib/package-labels";
import { listPublishedPackages, upcomingMonths } from "@/lib/packages";
import { getSiteContent } from "@/lib/site-config";
import { whatsappHref } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Travel packages",
  description:
    "Browse Umrah, Ziarah, group tour and domestic travel packages from Moghul Travel & Tours.",
};

function param(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

/** PackageListingPage [PKG-MTT-002-001] — mockup 3.2.1. */
export default async function PackagesPage({ searchParams }: PageProps<"/packages">) {
  const params = await searchParams;
  const filter = resolveCategoryFilter(param(params.category));
  const query = param(params.q);
  const month = param(params.month);

  const content = await getSiteContent();
  const packages = await listPublishedPackages({
    categories: filter?.categories,
    query,
    month,
  });

  const monthLabel = month ? upcomingMonths().find((m) => m.value === month)?.label : undefined;
  const searchParts = [
    query && `“${query}”`,
    monthLabel && `departing in ${monthLabel}`,
  ].filter(Boolean);

  return (
    <>
      <PageBanner title={filter ? `${filter.label} packages` : "Our travel packages"}>
        Browse our full range of Umrah, Ziarah, group tours, and domestic getaways.
      </PageBanner>

      <section className="mx-auto max-w-[1160px] px-4 pt-10 pb-16 sm:px-8 sm:pt-14">
        <div className="mb-9">
          <CategoryPills active={filter?.slug ?? null} />
        </div>

        {searchParts.length > 0 && (
          <p className="mb-6 text-center text-muted">
            Showing packages matching {searchParts.join(", ")}.{" "}
            <Link
              href={filter ? `/packages?category=${filter.slug}` : "/packages"}
              className="font-semibold text-primary underline underline-offset-4"
            >
              Clear search
            </Link>
          </p>
        )}

        {packages.length > 0 ? (
          <PackageGrid packages={packages} />
        ) : (
          <div className="mx-auto max-w-[560px] rounded-xl border border-line bg-white px-6 py-10 text-center">
            <h2 className="mb-2 text-xl text-primary-dark">No packages found</h2>
            <p className="mb-6 text-muted">
              {searchParts.length > 0 || filter
                ? "Nothing matches right now — try another category, or ask us directly. We often arrange trips on request."
                : "New packages are coming soon. In the meantime, our team is happy to help you plan your trip."}
            </p>
            <a
              href={whatsappHref(content, "Hi Moghul Travel & Tours, I'd like to ask about your travel packages.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#1f9d55] px-6 font-bold text-white"
            >
              <WhatsAppIcon className="size-5" />
              Ask us on WhatsApp
            </a>
          </div>
        )}
      </section>
    </>
  );
}

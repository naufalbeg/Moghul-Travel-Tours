import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DeletePackageButton } from "@/components/admin/delete-package-button";
import { Alert } from "@/components/ui/alert";
import { PageHeader, primaryButton, rowButton } from "@/components/admin/field";
import { EditIcon, ExternalIcon, PlusIcon, SearchIcon } from "@/components/ui/icons";
import { tabClass, tabCountClass } from "@/components/ui/tabs";
import { requireAdmin } from "@/lib/auth";
import { formatPrice, todayInMalaysia } from "@/lib/format";
import { CATEGORY_LABEL, PACKAGE_AVAILABILITY } from "@/lib/package-labels";
import { startingPrice, toPriceItems } from "@/lib/package-prices";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Manage packages" };

function param(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/** AdminPackageListPage [PKG-MTT-002-003]: status tabs, a title search, then the table. */
export default async function AdminPackagesPage({ searchParams }: PageProps<"/admin/packages">) {
  await requireAdmin();
  const params = await searchParams;
  const published = param(params.published);
  const saved = param(params.saved);

  const query = param(params.q)?.trim() || undefined;
  const show = param(params.show) === "published" ? "PUBLISHED" : param(params.show) === "drafts" ? "DRAFT" : undefined;

  const counts = await prisma.package.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } });
  const countOf = (status: "PUBLISHED" | "DRAFT") => counts.find((c) => c.status === status)?._count._all ?? 0;
  const total = countOf("PUBLISHED") + countOf("DRAFT");
  const tabs = [
    { slug: undefined, label: "All", count: total, active: !show },
    { slug: "published", label: "Published", count: countOf("PUBLISHED"), active: show === "PUBLISHED" },
    { slug: "drafts", label: "Drafts", count: countOf("DRAFT"), active: show === "DRAFT" },
  ];
  const listHref = (slug?: string, q?: string) => {
    const search = new URLSearchParams({ ...(slug && { show: slug }), ...(q && { q }) }).toString();
    return search ? `/admin/packages?${search}` : "/admin/packages";
  };

  const packages = await prisma.package.findMany({
    where: {
      deletedAt: null,
      ...(show && { status: show }),
      ...(query && { title: { contains: query, mode: "insensitive" } }),
    },
    orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      prices: { select: { type: true, amount: true } },
      adminNote: true,
      status: true,
      availability: true,
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } },
      _count: { select: { departures: { where: { departureDate: { gte: todayInMalaysia() } } } } },
    },
  });

  return (
    <>
      <PageHeader
        subtitle={
          total === 0
            ? "Nothing here yet."
            : `${countOf("PUBLISHED")} on the website, ${countOf("DRAFT")} ${countOf("DRAFT") === 1 ? "draft" : "drafts"}.`
        }
        action={
          <Link href="/admin/packages/new" className={primaryButton}>
            <PlusIcon className="size-[18px]" />
            Add new package
          </Link>
        }
      />

      {(published || saved) && (
        <div className="mb-5">
          <Alert tone="success" title={published ? `“${published}” is published.` : `“${saved}” is saved as a draft.`}>
            {published
              ? "It's now visible on the public website."
              : "Drafts are hidden from visitors until you publish them."}
          </Alert>
        </div>
      )}

      {total > 0 && (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line">
          <nav aria-label="Filter by status" className="flex flex-wrap gap-x-7">
            {tabs.map((tab) => (
              <Link
                key={tab.label}
                href={listHref(tab.slug, query)}
                aria-current={tab.active ? "page" : undefined}
                className={tabClass(tab.active)}
              >
                {tab.label}
                <span className={tabCountClass}>{tab.count}</span>
              </Link>
            ))}
          </nav>
          <form action="/admin/packages" role="search" className="flex w-full gap-2 pb-2 sm:w-auto">
            {show && <input type="hidden" name="show" value={show === "PUBLISHED" ? "published" : "drafts"} />}
            <label htmlFor="package-search" className="sr-only">
              Search packages by title
            </label>
            <input
              id="package-search"
              name="q"
              type="search"
              defaultValue={query}
              key={query ?? ""}
              placeholder="Search by title"
              className="min-h-10 w-full rounded-lg border-[1.5px] border-field bg-white px-3.5 text-meta sm:w-64"
            />
            <button type="submit" className={rowButton}>
              <SearchIcon className="size-4" />
              Search
            </button>
          </form>
        </div>
      )}

      {packages.length === 0 && total > 0 ? (
        <div className="rounded-xl border border-line bg-white px-6 py-12 text-center">
          <h2 className="mb-2 text-lg">No packages match</h2>
          <p className="mb-5 text-muted">
            {query ? `Nothing has “${query}” in its title${show ? " in this list" : ""}.` : "This list is empty."}
          </p>
          <Link href="/admin/packages" className="text-sm font-bold text-primary hover:underline">
            Show all packages
          </Link>
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-xl border border-line bg-white px-6 py-14 text-center">
          <h2 className="mb-2 text-lg">No packages yet</h2>
          <p className="mb-6 text-muted">Add your first package — it can stay a draft until it&apos;s ready.</p>
          <Link
            href="/admin/packages/new"
            className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-accent px-5 font-bold text-ink"
          >
            <PlusIcon className="size-[18px]" />
            Add new package
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-canvas text-sm font-bold tracking-wide text-muted">
                <th scope="col" className="px-5 py-4">Package</th>
                <th scope="col" className="px-5 py-4">Price</th>
                <th scope="col" className="px-5 py-4">Status</th>
                <th scope="col" className="px-5 py-4">Departures</th>
                <th scope="col" className="px-5 py-4">Actions</th>
                <th scope="col" className="px-5 py-4">Admin note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {packages.map((pkg) => {
                const isDraft = pkg.status === "DRAFT";
                const upcoming = pkg._count.departures;
                const availability = PACKAGE_AVAILABILITY[pkg.availability];
                const fromPrice = startingPrice(toPriceItems(pkg.prices));
                return (
                  <tr key={pkg.id} className={isDraft ? "bg-[#fafbfc]" : undefined}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="relative flex size-[46px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary-pale font-heading text-sm font-bold text-primary">
                          {pkg.images[0] ? (
                            <Image src={pkg.images[0].url} alt="" fill sizes="46px" className="object-cover" />
                          ) : (
                            pkg.title.slice(0, 2).toUpperCase()
                          )}
                        </span>
                        <div>
                          <div className={`font-semibold ${isDraft ? "text-muted" : ""}`}>{pkg.title}</div>
                          <div className="text-sm text-muted">{CATEGORY_LABEL[pkg.category]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm whitespace-nowrap text-muted">
                      {fromPrice !== null ? `From ${formatPrice(fromPrice)}` : "Not set"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`rounded-full px-3 py-1 text-[13px] font-bold whitespace-nowrap ${
                            isDraft ? "bg-primary-pale text-primary" : "bg-success-pale text-success"
                          }`}
                        >
                          {isDraft ? "Draft" : "Published"}
                        </span>
                        {pkg.availability !== "OPEN" && (
                          <span className={`rounded-full px-3 py-1 text-[13px] font-bold whitespace-nowrap ${availability.className}`}>
                            {availability.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm whitespace-nowrap text-muted">
                      {upcoming > 0 ? `${upcoming} upcoming` : "Not set"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/packages/${pkg.id}/edit`}
                          className={rowButton}
                        >
                          <EditIcon className="size-3.5" />
                          Edit
                        </Link>
                        {!isDraft && (
                          <Link
                            href={`/packages/${pkg.slug}`}
                            target="_blank"
                            className={rowButton}
                          >
                            <ExternalIcon className="size-3.5" />
                            View
                          </Link>
                        )}
                        <DeletePackageButton id={pkg.id} title={pkg.title} />
                      </div>
                    </td>
                    {/* Admins only (e.g. our own package or Suka Travels') — never on the website. */}
                    <td className="px-5 py-4 text-sm">
                      {pkg.adminNote ? (
                        <p className="max-w-60 rounded-md bg-accent-pale px-2.5 py-1.5 break-words whitespace-pre-line text-ink">
                          {pkg.adminNote}
                        </p>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

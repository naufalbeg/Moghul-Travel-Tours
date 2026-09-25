import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DeletePackageButton } from "@/components/admin/delete-package-button";
import { Alert } from "@/components/ui/alert";
import { EditIcon, ExternalIcon, PlusIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth";
import { formatPrice, todayInMalaysia } from "@/lib/format";
import { CATEGORY_LABEL, PACKAGE_AVAILABILITY } from "@/lib/package-labels";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Manage packages" };

function param(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/** AdminPackageListPage [PKG-MTT-002-003] — mockup 3.2.3. */
export default async function AdminPackagesPage({ searchParams }: PageProps<"/admin/packages">) {
  await requireAdmin();
  const params = await searchParams;
  const published = param(params.published);
  const saved = param(params.saved);

  const packages = await prisma.package.findMany({
    where: { deletedAt: null },
    orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      pricePerPax: true,
      status: true,
      availability: true,
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } },
      _count: { select: { departures: { where: { departureDate: { gte: todayInMalaysia() } } } } },
    },
  });

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="mb-1 text-[23px]">All packages</h2>
          <p className="text-muted">Manage published and draft travel packages.</p>
        </div>
        <Link
          href="/admin/packages/new"
          className="flex min-h-12 items-center justify-center gap-2 self-start rounded-lg bg-accent px-5 font-bold whitespace-nowrap text-white hover:bg-accent-dark"
        >
          <PlusIcon className="size-[18px]" />
          Add new package
        </Link>
      </div>

      {(published || saved) && (
        <div className="mb-5">
          <Alert tone="success" title={published ? `“${published}” is published.` : `“${saved}” is saved as a draft.`}>
            {published
              ? "It's now visible on the public website."
              : "Drafts are hidden from visitors until you publish them."}
          </Alert>
        </div>
      )}

      {packages.length === 0 ? (
        <div className="rounded-xl border border-line bg-white px-6 py-14 text-center">
          <h3 className="mb-2 text-lg">No packages yet</h3>
          <p className="mb-6 text-muted">Add your first package — it can stay a draft until it&apos;s ready.</p>
          <Link
            href="/admin/packages/new"
            className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-accent px-5 font-bold text-white"
          >
            <PlusIcon className="size-[18px]" />
            Add new package
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-canvas text-[13px] font-bold tracking-wide text-muted">
                <th scope="col" className="px-5 py-4">Package</th>
                <th scope="col" className="px-5 py-4">Price</th>
                <th scope="col" className="px-5 py-4">Status</th>
                <th scope="col" className="px-5 py-4">Departures</th>
                <th scope="col" className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {packages.map((pkg) => {
                const isDraft = pkg.status === "DRAFT";
                const upcoming = pkg._count.departures;
                const availability = PACKAGE_AVAILABILITY[pkg.availability];
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
                    <td className="px-5 py-4 text-sm text-muted">
                      {Number(pkg.pricePerPax) > 0 ? formatPrice(pkg.pricePerPax) : "Not set"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            isDraft ? "bg-primary-pale text-primary" : "bg-success-pale text-success"
                          }`}
                        >
                          {isDraft ? "Draft" : "Published"}
                        </span>
                        {pkg.availability !== "OPEN" && (
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${availability.className}`}>
                            {availability.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted">
                      {upcoming > 0 ? `${upcoming} upcoming` : "Not set"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/packages/${pkg.id}/edit`}
                          className="flex min-h-9 items-center gap-1.5 rounded-[7px] border border-line px-3 text-[13.5px] font-semibold hover:border-primary"
                        >
                          <EditIcon className="size-3.5" />
                          Edit
                        </Link>
                        {!isDraft && (
                          <Link
                            href={`/packages/${pkg.slug}`}
                            target="_blank"
                            className="flex min-h-9 items-center gap-1.5 rounded-[7px] border border-line px-3 text-[13.5px] font-semibold hover:border-primary"
                          >
                            <ExternalIcon className="size-3.5" />
                            View
                          </Link>
                        )}
                        <DeletePackageButton id={pkg.id} title={pkg.title} />
                      </div>
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

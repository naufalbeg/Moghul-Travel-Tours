import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/field";
import { Alert } from "@/components/ui/alert";
import type { InquiryStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/auth";
import { INQUIRY_STATUS, INQUIRY_STATUS_ORDER, formatReceived } from "@/lib/inquiry-labels";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Inquiries" };

const FILTER_SLUGS: Record<string, InquiryStatus> = { new: "NEW", "in-progress": "IN_PROGRESS", resolved: "RESOLVED" };

/** AdminInquiryDashboardPage [PKG-MTT-003-002] — REQ-MTT-003-007: newest first, with status badges. */
export default async function AdminInquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  await requireAdmin();
  const params = await searchParams;
  const filterSlug = typeof params.status === "string" ? params.status : undefined;
  const status = filterSlug ? FILTER_SLUGS[filterSlug] : undefined;
  const deleted = typeof params.deleted === "string" ? params.deleted : undefined;

  const [counts, inquiries] = await Promise.all([
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.inquiry.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      select: { id: true, fullName: true, email: true, phone: true, packageInterest: true, status: true, createdAt: true },
    }),
  ]);
  const countOf = (s: InquiryStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count._all, 0);

  const tabs = [
    { slug: undefined, label: "All", count: total },
    ...INQUIRY_STATUS_ORDER.map((s) => ({
      slug: Object.keys(FILTER_SLUGS).find((k) => FILTER_SLUGS[k] === s),
      label: INQUIRY_STATUS[s].label,
      count: countOf(s),
    })),
  ];

  return (
    <>
      <PageHeader title="Inquiries" subtitle="Messages sent through the website's inquiry form, newest first." />

      {deleted && (
        <div className="mb-5">
          <Alert tone="success" title={`Deleted the inquiry from ${deleted}.`} />
        </div>
      )}

      <nav aria-label="Filter by status" className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = tab.slug === filterSlug || (!tab.slug && !status);
          return (
            <Link
              key={tab.label}
              href={tab.slug ? `/admin/inquiries?status=${tab.slug}` : "/admin/inquiries"}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-10 items-center rounded-full border-[1.5px] px-4 text-sm font-semibold ${
                active ? "border-primary bg-primary text-white" : "border-line bg-white hover:border-primary"
              }`}
            >
              {tab.label} ({tab.count})
            </Link>
          );
        })}
      </nav>

      {inquiries.length === 0 ? (
        <div className="rounded-xl border border-line bg-white px-6 py-14 text-center">
          <h3 className="mb-2 text-lg">{total === 0 ? "No inquiries yet" : "Nothing here"}</h3>
          <p className="text-muted">
            {total === 0
              ? "When visitors send the inquiry form, their messages appear here and you get an email."
              : "No inquiries have this status."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-canvas text-[13px] font-bold tracking-wide text-muted">
                <th scope="col" className="px-5 py-4">From</th>
                <th scope="col" className="px-5 py-4">Package</th>
                <th scope="col" className="px-5 py-4">Received</th>
                <th scope="col" className="px-5 py-4">Status</th>
                <th scope="col" className="px-5 py-4"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {inquiries.map((q) => {
                const pill = INQUIRY_STATUS[q.status];
                return (
                  <tr key={q.id} className={q.status === "NEW" ? "bg-accent-pale/30" : undefined}>
                    <td className="px-5 py-4">
                      <Link href={`/admin/inquiries/${q.id}`} className={`hover:underline ${q.status === "NEW" ? "font-bold" : "font-semibold"}`}>
                        {q.fullName}
                      </Link>
                      <div className="text-sm text-muted">
                        {q.phone} · {q.email}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm">{q.packageInterest ?? <span className="text-muted">General inquiry</span>}</td>
                    <td className="px-5 py-4 text-sm whitespace-nowrap text-muted">{formatReceived(q.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${pill.className}`}>{pill.label}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/inquiries/${q.id}`}
                        className="inline-flex min-h-9 items-center rounded-[7px] border border-line px-3 text-[13.5px] font-semibold hover:border-primary"
                      >
                        Open
                      </Link>
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

import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { PageHeader, primaryButton } from "@/components/admin/field";
import { Alert } from "@/components/ui/alert";
import { EditIcon, ExternalIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { deleteTestimonial } from "./actions";

export const metadata: Metadata = { title: "Testimonials" };

/** AdminTestimonialsPanel [PKG-MTT-005-002] — list with Edit / Delete. */
export default async function AdminTestimonialsPage({ searchParams }: PageProps<"/admin/testimonials">) {
  await requireAdmin();
  const saved = (await searchParams).saved;
  const testimonials = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });

  const addButton = (
    <Link href="/admin/testimonials/new" className={primaryButton}>
      <PlusIcon className="size-[18px]" />
      Add testimonial
    </Link>
  );

  return (
    <>
      <PageHeader title="Testimonials" subtitle="Customer reviews shown on the homepage and the Reviews page." action={addButton} />

      {typeof saved === "string" && (
        <div className="mb-5">
          <Alert tone="success" title={`Saved the review from ${saved}.`}>
            It&apos;s now visible on the website.
          </Alert>
        </div>
      )}

      {testimonials.length === 0 ? (
        <div className="rounded-xl border border-line bg-white px-6 py-14 text-center">
          <h3 className="mb-2 text-lg">No testimonials yet</h3>
          <p className="mb-6 text-muted">Add a review from a happy customer — the homepage shows the newest one.</p>
          <div className="flex justify-center">{addButton}</div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex justify-end">
            <Link href="/testimonials" target="_blank" className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              View the Reviews page <ExternalIcon className="size-3.5" />
            </Link>
          </div>
          <ul className="space-y-3">
            {testimonials.map((t) => (
              <li key={t.id} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold">{t.customerName}</span>
                    <span className="text-accent" aria-label={`${t.starRating} out of 5 stars`}>
                      {"★".repeat(t.starRating)}
                      <span className="text-line">{"★".repeat(5 - t.starRating)}</span>
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-muted">
                    {t.tripName}
                    {t.tripDate && ` · ${formatDate(t.tripDate)}`}
                  </p>
                  <p className="line-clamp-2 text-[15px]">&ldquo;{t.reviewText}&rdquo;</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/admin/testimonials/${t.id}/edit`}
                    className="flex min-h-9 items-center gap-1.5 rounded-[7px] border border-line px-3 text-[13.5px] font-semibold hover:border-primary"
                  >
                    <EditIcon className="size-3.5" />
                    Edit
                  </Link>
                  <ConfirmActionButton
                    label="Delete"
                    icon={<TrashIcon className="size-3.5" />}
                    title="Delete this testimonial?"
                    confirmLabel="Delete testimonial"
                    action={deleteTestimonial.bind(null, t.id)}
                  >
                    The review from <strong className="text-ink">{t.customerName}</strong> will be removed from the
                    website permanently.
                  </ConfirmActionButton>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

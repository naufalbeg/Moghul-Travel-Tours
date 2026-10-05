import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { centeredPage } from "@/components/admin/field";
import { InquiryStatusControl } from "@/components/admin/inquiry-status-control";
import { MailIcon, PhoneIcon, TrashIcon, WhatsAppIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth";
import { formatPrice, formatTripDates } from "@/lib/format";
import { INQUIRY_KIND, INQUIRY_STATUS, formatReceived } from "@/lib/inquiry-labels";
import { bookedTravellers, priceTypeLabel } from "@/lib/package-prices";
import { prisma } from "@/lib/prisma";
import { telHref, whatsappHref } from "@/lib/site-content";
import { deleteInquiry } from "../actions";

export const metadata: Metadata = { title: "Inquiry" };

/** Inquiry detail view (Figure 3.3.4) — full details, contact shortcuts, status update. */
export default async function InquiryDetailPage({ params }: PageProps<"/admin/inquiries/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const q = await prisma.inquiry.findUnique({
    where: { id },
    include: { package: { select: { slug: true, durationDays: true, deletedAt: true, status: true } } },
  });
  if (!q) notFound();

  const pkg = q.packageInterest ?? "General inquiry";
  const pill = INQUIRY_STATUS[q.status];
  const isBooking = q.kind === "BOOKING";
  const travellers = bookedTravellers(q.travellers);
  const departure = q.departureDate ? formatTripDates(q.departureDate, q.package?.durationDays ?? null) : null;
  const about = isBooking ? `your booking request for ${pkg}${departure ? ` (${departure})` : ""}` : `your inquiry about ${pkg}`;
  const livePackage = q.package && !q.package.deletedAt && q.package.status === "PUBLISHED" ? q.package.slug : null;
  const contactButton =
    "flex min-h-12 items-center justify-center gap-2 rounded-lg border-[1.5px] px-4 font-bold";

  return (
    <div className={centeredPage}>
      <Link href="/admin/inquiries" className="mb-4 inline-block text-sm font-semibold text-primary hover:underline">
        ← All inquiries
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="text-[23px]">{q.fullName}</h2>
        {isBooking && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${INQUIRY_KIND.BOOKING.className}`}>
            {INQUIRY_KIND.BOOKING.label}
          </span>
        )}
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${pill.className}`}>{pill.label}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="rounded-xl border border-line bg-white p-6">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[15px]">
            <dt className="text-muted">Package</dt>
            <dd className="font-semibold">
              {livePackage ? (
                <Link href={`/packages/${livePackage}`} target="_blank" className="text-primary hover:underline">
                  {pkg}
                </Link>
              ) : (
                pkg
              )}
            </dd>
            <dt className="text-muted">Phone</dt>
            <dd className="font-semibold">{q.phone}</dd>
            <dt className="text-muted">Email</dt>
            <dd className="font-semibold break-all">{q.email}</dd>
            <dt className="text-muted">Received</dt>
            <dd>{formatReceived(q.createdAt)}</dd>
            <dt className="text-muted">Email alert</dt>
            <dd>
              {q.notifiedAt ? (
                <span className="text-success">Sent</span>
              ) : (
                <span className="text-danger">Not sent — the email service was unavailable. The inquiry itself is safe.</span>
              )}
            </dd>
          </dl>

          {isBooking && (
            <>
              <h3 className="mt-6 mb-2 text-base">Booking request</h3>
              <p className="mb-3 text-[15px]">
                Departure: <strong>{departure ?? "—"}</strong>
              </p>
              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="w-full border-collapse text-left text-[15px]">
                  <thead>
                    <tr className="bg-canvas text-[13px] font-bold text-muted">
                      <th scope="col" className="px-4 py-2.5">Travellers</th>
                      <th scope="col" className="px-4 py-2.5 text-right">Price per person</th>
                      <th scope="col" className="px-4 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {travellers.map((t) => (
                      <tr key={t.type}>
                        <td className="px-4 py-2.5">
                          <strong>{t.count} ×</strong> {priceTypeLabel(t.type)}
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">{formatPrice(t.amount)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                          {formatPrice(t.count * t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-line bg-primary-pale font-bold">
                      <td className="px-4 py-3" colSpan={2}>
                        Estimated total ({travellers.reduce((sum, t) => sum + t.count, 0)} pax)
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {q.estimatedTotal !== null ? formatPrice(q.estimatedTotal) : "—"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="mt-2 text-[13px] text-muted">
                The website&apos;s starting prices when they booked. Confirm the seats, final price and payment with the
                customer.
              </p>
            </>
          )}

          <h3 className="mt-6 mb-2 text-base">{isBooking ? "Notes" : "Message"}</h3>
          {q.message ? (
            <p className="rounded-lg bg-canvas p-4 leading-relaxed whitespace-pre-line">{q.message}</p>
          ) : (
            <p className="text-muted">{isBooking ? "No notes." : "No message — they only picked a package."}</p>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border border-line bg-white p-6">
            <h3 className="mb-3 text-base">Reply</h3>
            <div className="flex flex-col gap-2.5">
              <a
                href={whatsappHref({ whatsapp: q.phone }, `Hi ${q.fullName}, this is Moghul Travel & Tours replying to ${about}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${contactButton} border-[#1f9d55] bg-[#1f9d55] text-white`}
              >
                <WhatsAppIcon className="size-5" />
                WhatsApp them
              </a>
              <a href={telHref(q.phone)} className={`${contactButton} border-primary text-primary`}>
                <PhoneIcon className="size-5" />
                Call {q.phone}
              </a>
              <a
                href={`mailto:${q.email}?subject=${encodeURIComponent(`Re: ${about}`)}`}
                className={`${contactButton} border-primary text-primary`}
              >
                <MailIcon className="size-5" />
                Email them
              </a>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-6">
            <h3 className="mb-3 text-base">Status</h3>
            <InquiryStatusControl id={q.id} status={q.status} />
            <div className="mt-5 border-t border-line pt-4">
              {q.status === "RESOLVED" ? (
                <ConfirmActionButton
                  label="Delete inquiry"
                  icon={<TrashIcon className="size-3.5" />}
                  title="Delete this inquiry?"
                  confirmLabel="Delete permanently"
                  action={deleteInquiry.bind(null, q.id)}
                >
                  The inquiry from <strong className="text-ink">{q.fullName}</strong> will be deleted permanently.
                </ConfirmActionButton>
              ) : (
                <p className="text-[13px] text-muted">Resolved inquiries can be deleted.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

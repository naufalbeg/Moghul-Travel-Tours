import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageBanner } from "@/components/public/page-banner";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Traveller reviews",
  description: "What our Umrah, Ziarah and tour travellers say about Moghul Travel & Tours.",
};

/** TestimonialsPage [PKG-MTT-005-001] — REQ-MTT-005-003, newest first. */
export default async function TestimonialsPage() {
  await connection();
  const testimonials = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <PageBanner title="What our travellers say">
        Reviews from families, pilgrims and groups who travelled with us.
      </PageBanner>

      <section className="mx-auto max-w-[1160px] px-4 py-12 sm:px-8">
        {testimonials.length === 0 ? (
          <div className="mx-auto max-w-[520px] rounded-xl border border-line bg-white px-6 py-10 text-center">
            <p className="mb-5 text-muted">Reviews from our travellers will appear here soon.</p>
            <Link href="/packages" className="font-semibold text-primary underline underline-offset-4">
              Browse our packages
            </Link>
          </div>
        ) : (
          <ul className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {testimonials.map((t) => (
              <li key={t.id} className="mb-6 break-inside-avoid">
                <figure className="rounded-xl border border-line bg-white p-6">
                  <p className="mb-2 text-lg tracking-[2px] text-accent" aria-label={`${t.starRating} out of 5 stars`}>
                    {"★".repeat(t.starRating)}
                  </p>
                  <blockquote className="mb-4 text-[17px] leading-relaxed whitespace-pre-line">
                    &ldquo;{t.reviewText}&rdquo;
                  </blockquote>
                  <figcaption>
                    <span className="block font-semibold text-primary-dark">{t.customerName}</span>
                    <span className="text-sm text-muted">
                      {t.tripName}
                      {t.tripDate && ` · ${formatDate(t.tripDate, { day: undefined })}`}
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

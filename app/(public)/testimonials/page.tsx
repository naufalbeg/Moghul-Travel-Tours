import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageBanner } from "@/components/public/page-banner";
import { formatDate } from "@/lib/format";
import { fmt } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.meta.testimonialsTitle, description: t.meta.testimonialsDescription };
}

/** TestimonialsPage [PKG-MTT-005-001] — REQ-MTT-005-003, newest first. */
export default async function TestimonialsPage() {
  await connection();
  const [testimonials, t, locale] = await Promise.all([
    prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } }),
    getDictionary(),
    getLocale(),
  ]);

  return (
    <>
      <PageBanner title={t.testimonials.title}>{t.testimonials.subtitle}</PageBanner>

      <section className="mx-auto max-w-[1160px] px-4 py-12 sm:px-8">
        {testimonials.length === 0 ? (
          <div className="mx-auto max-w-[520px] rounded-xl border border-line bg-white px-6 py-10 text-center">
            <p className="mb-5 text-muted">{t.testimonials.empty}</p>
            <Link href="/packages" className="font-semibold text-primary underline underline-offset-4">
              {t.testimonials.browse}
            </Link>
          </div>
        ) : (
          <ul className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {testimonials.map((review) => (
              <li key={review.id} className="mb-6 break-inside-avoid">
                <figure className="rounded-xl border border-line bg-white p-6">
                  <p className="mb-2 text-lg tracking-[2px] text-accent" aria-label={fmt(t.testimonials.stars, { n: review.starRating })}>
                    {"★".repeat(review.starRating)}
                  </p>
                  <blockquote className="mb-4 text-[17px] leading-relaxed whitespace-pre-line">
                    &ldquo;{review.reviewText}&rdquo;
                  </blockquote>
                  <figcaption>
                    <span className="block font-semibold text-primary-dark">{review.customerName}</span>
                    <span className="text-sm text-muted">
                      {review.tripName}
                      {review.tripDate && ` · ${formatDate(review.tripDate, { day: undefined }, locale)}`}
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

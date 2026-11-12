import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageBanner } from "@/components/public/page-banner";
import { ArrowRightIcon } from "@/components/ui/icons";
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

      <section className="wrap pt-10 pb-[clamp(56px,7vw,104px)]">
        {testimonials.length === 0 ? (
          <div className="max-w-[60ch] rounded-xl border border-line bg-white px-6 py-8">
            <p className="mb-4 text-muted">{t.testimonials.empty}</p>
            <Link href="/packages" className="arrow-link">
              {t.testimonials.browse}
              <ArrowRightIcon className="nudge size-[22px]" />
            </Link>
          </div>
        ) : (
          <ul className="columns-1 gap-6 sm:columns-2 mid:columns-3">
            {testimonials.map((review) => (
              <li key={review.id} className="mb-6 break-inside-avoid">
                <figure className="rounded-xl border border-line bg-white p-6">
                  <p
                    className="text-lead tracking-[2px] text-accent-dark"
                    role="img"
                    aria-label={fmt(t.testimonials.stars, { n: review.starRating })}
                  >
                    {"★".repeat(review.starRating)}
                  </p>
                  <blockquote className="mt-3 whitespace-pre-line">{review.reviewText}</blockquote>
                  <figcaption className="mt-4 text-meta text-muted">
                    <strong className="block text-body text-primary-dark">{review.customerName}</strong>
                    {review.tripName}
                    {review.tripDate && ` · ${formatDate(review.tripDate, { day: undefined }, locale)}`}
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

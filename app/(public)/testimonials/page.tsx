import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageBanner } from "@/components/public/page-banner";
import { PhotoStrip } from "@/components/public/photo-strip";
import { Stars } from "@/components/ui/stars";
import { ArrowRightIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";
import { fmt } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: t.meta.testimonialsTitle,
    description: t.meta.testimonialsDescription,
    alternates: { canonical: "/testimonials" },
  };
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
          // No reviews yet: say so plainly, and let the customers' own photos speak meanwhile.
          <div>
            <p className="max-w-[60ch] text-lead">{t.testimonials.empty}</p>
            <p className="mt-2 mb-7 max-w-[60ch] text-muted">{t.testimonials.meanwhile}</p>
            <PhotoStrip />
            <div className="mt-7 flex flex-wrap gap-x-8 gap-y-1">
              <Link href="/gallery" className="arrow-link">
                {t.testimonials.viewGallery}
                <ArrowRightIcon className="nudge size-[22px]" />
              </Link>
              <Link href="/packages" className="arrow-link">
                {t.testimonials.browse}
                <ArrowRightIcon className="nudge size-[22px]" />
              </Link>
            </div>
          </div>
        ) : (
          <ul className="columns-1 gap-6 sm:columns-2 mid:columns-3">
            {testimonials.map((review) => (
              <li key={review.id} className="mb-6 break-inside-avoid">
                <figure className="rounded-xl border border-line bg-white p-6">
                  <Stars rating={review.starRating} label={fmt(t.testimonials.stars, { n: review.starRating })} />
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageGallery } from "@/components/public/package-gallery";
import { CheckIcon, ClockIcon, PhoneIcon, ShieldIcon, UserIcon } from "@/components/ui/icons";
import { formatDate, formatPrice } from "@/lib/format";
import {
  CATEGORY_LABEL,
  DEPARTURE_AVAILABILITY,
  PACKAGE_AVAILABILITY,
  dayLabel,
  durationLabel,
} from "@/lib/package-labels";
import { getPublishedPackage } from "@/lib/packages";
import { getSiteContent } from "@/lib/site-config";
import { inquireHref, telHref } from "@/lib/site-content";

export async function generateMetadata({ params }: PageProps<"/packages/[slug]">): Promise<Metadata> {
  const pkg = await getPublishedPackage((await params).slug);
  if (!pkg) return { title: "Package not found" };
  return {
    title: pkg.title,
    description: pkg.description.slice(0, 160),
    openGraph: { title: pkg.title, images: pkg.images[0] ? [pkg.images[0].url] : undefined },
  };
}

/** PackageDetailPage [PKG-MTT-002-002] — mockup 3.2.2. */
export default async function PackageDetailPage({ params }: PageProps<"/packages/[slug]">) {
  const [pkg, content] = await Promise.all([getPublishedPackage((await params).slug), getSiteContent()]);
  if (!pkg) notFound();

  const duration = durationLabel(pkg.durationDays, pkg.durationNights);
  const availability = PACKAGE_AVAILABILITY[pkg.availability];
  const isBookable = pkg.availability !== "FULL";

  return (
    <>
      <nav aria-label="Breadcrumb" className="border-b border-line bg-white py-3.5">
        <ol className="mx-auto flex max-w-[1160px] flex-wrap px-4 sm:px-8 items-center gap-x-1.5 text-sm text-muted">
          <li>
            <Link href="/" className="font-semibold text-primary">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/packages" className="font-semibold text-primary">
              Packages
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{pkg.title}</li>
        </ol>
      </nav>

      <div className="mx-auto max-w-[1160px] px-4 pt-7 sm:px-8">
        <PackageGallery images={pkg.images} title={pkg.title} />
      </div>

      {/* Phones: title → price card → details. Desktop: price card is a sticky sidebar. */}
      <div className="mx-auto grid max-w-[1160px] gap-y-7 px-4 pt-9 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] lg:gap-x-9 lg:gap-y-6">
        <header className="lg:col-start-1">
          <p className="mb-2 text-[13px] font-bold tracking-wide text-accent-dark">
            {CATEGORY_LABEL[pkg.category]}
          </p>
          <h1 className="mb-2.5 text-[26px] text-primary-dark sm:text-[28px]">{pkg.title}</h1>
          <ul className="flex flex-wrap gap-x-[18px] gap-y-2 text-[15px] font-medium text-muted">
            {duration && (
              <li className="flex items-center gap-1.5">
                <ClockIcon className="size-[17px] text-primary" />
                {duration}
              </li>
            )}
            {pkg.roomSharing && (
              <li className="flex items-center gap-1.5">
                <UserIcon className="size-[17px] text-primary" />
                {pkg.roomSharing}
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <ShieldIcon className="size-[17px] text-primary" />
              MOTAC licensed package
            </li>
          </ul>
        </header>

        <aside className="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="rounded-[14px] border border-line bg-white p-6 sm:p-[26px]">
            <p className="font-heading text-[30px] font-bold text-primary-dark">{formatPrice(pkg.price)}</p>
            <p className="mb-5 text-sm text-muted">per person</p>

            {pkg.availability !== "OPEN" && (
              <p className={`mb-5 rounded-lg px-3.5 py-2.5 text-sm font-bold ${availability.className}`}>
                {availability.label}
              </p>
            )}

            <h2 className="mb-3 font-sans text-sm font-bold text-ink">Upcoming departure dates</h2>
            {pkg.departures.length > 0 ? (
              <ul className="mb-5 divide-y divide-line">
                {pkg.departures.map((d) => {
                  const pill = DEPARTURE_AVAILABILITY[d.availability];
                  return (
                    <li key={d.id} className="flex items-center justify-between py-2.5 text-[15px]">
                      <span>{formatDate(d.departureDate)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${pill.className}`}>
                        {pill.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mb-5 text-[15px] text-muted">
                New dates are being arranged — ask us for the latest schedule.
              </p>
            )}

            <Link
              href={inquireHref(pkg.slug)}
              className="mb-3.5 flex min-h-14 items-center justify-center rounded-[10px] bg-accent px-5 text-[17px] font-bold text-white hover:bg-accent-dark"
            >
              {isBookable ? "Inquire now" : "Ask about the next trip"}
            </Link>
            <a
              href={telHref(content.phone)}
              className="mb-[18px] flex items-center justify-center gap-2 text-[15px] font-semibold text-primary"
            >
              <PhoneIcon className="size-4" />
              Or call {content.phone}
            </a>

            <p className="flex items-start gap-2 border-t border-line pt-4 text-[13px] text-muted">
              <ShieldIcon className="mt-px size-4 shrink-0 text-primary" />
              MOTAC licensed ({content.motac_license}) — over a decade
              of guiding Malaysian travellers.
            </p>
          </div>
        </aside>

        <div className="min-w-0 lg:col-start-1">
          <section className="mb-8">
            <h2 className="mb-3.5 text-xl text-primary-dark">About this package</h2>
            <p className="leading-relaxed whitespace-pre-line text-muted">{pkg.description}</p>
          </section>

          {pkg.inclusions.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3.5 text-xl text-primary-dark">What&apos;s included</h2>
              <ul className="grid gap-x-7 gap-y-3 sm:grid-cols-2">
                {pkg.inclusions.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 font-medium">
                    <CheckIcon className="mt-1 size-[19px] shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pkg.itinerary.length > 0 && (
            <section>
              <h2 className="mb-2 text-xl text-primary-dark">Itinerary</h2>
              <ol className="divide-y divide-line">
                {pkg.itinerary.map((day) => (
                  <li key={day.id} className="flex gap-4 py-[18px]">
                    <span className="flex h-10 w-[72px] shrink-0 items-center justify-center rounded-lg bg-primary-pale font-heading text-[13.5px] font-bold text-primary">
                      {dayLabel(day.dayStart, day.dayEnd)}
                    </span>
                    <div>
                      <h3 className="mb-1 font-sans text-base font-bold text-ink">{day.title}</h3>
                      <p className="text-[15px] leading-relaxed whitespace-pre-line text-muted">
                        {day.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

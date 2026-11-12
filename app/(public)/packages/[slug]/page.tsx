import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BookingForm, type BookingDeparture, type BookingOption } from "@/components/public/booking-form";
import { PackageGrid } from "@/components/public/package-card";
import { PackageGallery } from "@/components/public/package-gallery";
import { JsonLd } from "@/components/ui/json-ld";
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  PhoneIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/ui/icons";
import { formatDate, formatPrice, formatTripDates } from "@/lib/format";
import { fmt } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { DEPARTURE_AVAILABILITY, PACKAGE_AVAILABILITY, dayLabel, durationLabel } from "@/lib/package-labels";
import { offeredPrices } from "@/lib/package-prices";
import { getPublishedPackage, listPublishedPackages } from "@/lib/packages";
import { getPublicContent } from "@/lib/site-config";
import { inquireHref, telHref } from "@/lib/site-content";
import { breadcrumbJsonLd, packageJsonLd } from "@/lib/structured-data";
import { canBookOnline } from "@/lib/validation/booking";

export async function generateMetadata({ params }: PageProps<"/packages/[slug]">): Promise<Metadata> {
  const pkg = await getPublishedPackage((await params).slug);
  if (!pkg) return { title: (await getDictionary()).meta.packageNotFound };
  return {
    title: pkg.title,
    description: pkg.description.slice(0, 160),
    alternates: { canonical: `/packages/${pkg.slug}` },
    openGraph: { title: pkg.title, images: pkg.images[0] ? [pkg.images[0].url] : undefined },
  };
}

const crumb =
  "inline-flex min-h-11 items-center font-bold text-primary underline decoration-transparent underline-offset-[0.2em] hover:decoration-current";

function Section({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="reveal mb-10">
      <h2 className="mb-4 text-display font-extrabold text-primary-dark">{title}</h2>
      {children}
    </section>
  );
}

/**
 * PackageDetailPage [PKG-MTT-002-002]: photos, the package's details, and a
 * price card that stays in view on computers (on phones it sits under the
 * title). The booking form is at the bottom (#tempahan).
 */
export default async function PackageDetailPage({ params }: PageProps<"/packages/[slug]">) {
  const [pkg, content, t, locale] = await Promise.all([
    getPublishedPackage((await params).slug),
    getPublicContent(),
    getDictionary(),
    getLocale(),
  ]);
  if (!pkg) notFound();

  const duration = durationLabel(pkg.durationDays, pkg.durationNights, t.duration);
  const availability = PACKAGE_AVAILABILITY[pkg.availability];
  const isBookable = pkg.availability !== "FULL";
  const prices = offeredPrices(pkg.prices);
  // "Twin, triple or single room" / "Bilik twin, triple atau single" — from the adult prices.
  const roomNames = prices.flatMap((p) =>
    p.type in t.prices.rooms ? [t.prices.rooms[p.type as keyof typeof t.prices.rooms]] : [],
  );
  const rooms =
    roomNames.length > 0
      ? fmt(t.prices.roomsOffered, {
          rooms:
            roomNames.length > 1
              ? `${roomNames.slice(0, -1).join(", ")} ${t.prices.or} ${roomNames.at(-1)}`
              : roomNames[0],
        })
      : null;
  const roomsLabel = rooms && `${rooms.charAt(0).toUpperCase()}${rooms.slice(1)}`;

  // Booking form: one option per price in the list, dates as "11–21 Sep 2027".
  const canBook = canBookOnline(pkg.availability, pkg.departures) && pkg.fromPrice !== null;
  const bookingOptions: BookingOption[] = prices.map((p) => ({
    key: p.type,
    label: t.prices.types[p.type].label,
    hint: t.prices.types[p.type].hint,
    amount: p.amount,
  }));
  const jumps = [
    pkg.highlights.length > 0 && { id: "tarikan", label: t.detail.highlights },
    pkg.inclusions.length > 0 && { id: "termasuk", label: t.detail.included },
    pkg.itinerary.length > 0 && { id: "itinerari", label: t.detail.itinerary },
    prices.length > 0 && { id: "prices", label: t.prices.heading },
    canBook && { id: "tempahan", label: t.client.booking.heading },
  ].filter(Boolean) as { id: string; label: string }[];

  // Up to three other packages of the same kind, for whoever this one doesn't suit.
  const related = (await listPublishedPackages({ categories: [pkg.category], take: 4 }))
    .filter((other) => other.id !== pkg.id)
    .slice(0, 3);

  const bookingDepartures: BookingDeparture[] = pkg.departures.map((d) => ({
    date: d.departureDate.toISOString().slice(0, 10),
    label: formatTripDates(d.departureDate, pkg.durationDays, locale),
    availability: d.availability,
  }));

  return (
    <>
      <JsonLd
        data={packageJsonLd({
          slug: pkg.slug,
          title: pkg.title,
          description: pkg.description,
          imageUrls: pkg.images.map((image) => image.url),
          fromPrice: pkg.fromPrice,
          soldOut: pkg.availability === "FULL",
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t.detail.home, path: "/" },
          { name: t.detail.packages, path: "/packages" },
          { name: pkg.title, path: `/packages/${pkg.slug}` },
        ])}
      />
      <nav aria-label={t.detail.breadcrumb} className="border-b border-line">
        <ol className="wrap flex flex-wrap items-center gap-x-2 text-fine text-muted">
          <li>
            <Link href="/" className={crumb}>
              {t.detail.home}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/packages" className={crumb}>
              {t.detail.packages}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="py-2.5">
            {pkg.title}
          </li>
        </ol>
      </nav>

      <div className="wrap pt-7">
        <PackageGallery images={pkg.images} title={pkg.title} />
      </div>

      {/* Phones: title → price card → details. Computers: the price card is a sticky sidebar. */}
      <div className="wrap grid gap-y-7 pt-9 pb-[clamp(56px,7vw,104px)] lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] lg:gap-x-12 lg:gap-y-8">
        <header className="lg:col-start-1">
          <p className="text-meta text-muted">{t.categories[pkg.category]}</p>
          <h1 className="mt-1.5 text-[clamp(30px,3.4vw,44px)] leading-[1.08] font-extrabold tracking-[-0.025em] text-primary-dark">
            {pkg.title}
          </h1>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-meta text-muted">
            {duration && (
              <li className="flex items-center gap-2">
                <ClockIcon strokeWidth={2} className="size-[18px] text-primary" />
                {duration}
              </li>
            )}
            {roomsLabel && (
              <li className="flex items-center gap-2">
                <UserIcon strokeWidth={2} className="size-[18px] text-primary" />
                {roomsLabel}
              </li>
            )}
          </ul>
          {/* A long page: let people jump straight to what they came for. */}
          {jumps.length > 1 && (
            <nav aria-label={t.detail.jumpLabel} className="mt-4 flex flex-wrap gap-x-5 border-t border-line pt-1">
              {jumps.map((jump) => (
                <a key={jump.id} href={`#${jump.id}`} className="text-link inline-flex min-h-11 items-center text-meta">
                  {jump.label}
                </a>
              ))}
            </nav>
          )}
        </header>

        <aside className="lg:sticky lg:top-[112px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="rounded-xl border border-line bg-white p-6">
            {pkg.fromPrice !== null ? (
              <>
                <p className="text-fine text-muted">{t.prices.startsFrom}</p>
                <p className="text-[34px] leading-tight font-extrabold tracking-[-0.02em] text-primary-dark">
                  {formatPrice(pkg.fromPrice)}{" "}
                  <span className="text-fine font-normal tracking-normal text-muted">{t.prices.perPerson}</span>
                </p>
                <a href="#prices" className="text-link mb-3 inline-flex min-h-11 items-center text-meta">
                  {t.prices.seeDetails}
                </a>
              </>
            ) : (
              <p className="mb-5 text-title font-bold text-primary-dark">{t.prices.askForPrice}</p>
            )}

            {pkg.availability !== "OPEN" && (
              <p className={`mb-5 rounded-lg px-3.5 py-2.5 text-meta font-bold ${availability.className}`}>
                {t.availability[pkg.availability]}
              </p>
            )}

            <h2 className="mb-1 text-meta font-bold tracking-normal text-ink">{t.detail.departures}</h2>
            {pkg.departures.length > 0 ? (
              <ul className="mb-5 border-t border-line">
                {pkg.departures.map((d) => {
                  const pill = DEPARTURE_AVAILABILITY[d.availability];
                  return (
                    <li key={d.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-meta">
                      <span className="tabular-nums">{formatDate(d.departureDate, {}, locale)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-fine font-bold ${pill.className}`}>
                        {t.departureAvailability[d.availability]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mb-5 text-meta text-muted">{t.detail.noDepartures}</p>
            )}

            {canBook ? (
              <>
                {/* Book (the form at the bottom), or just ask a question first. */}
                <a href="#tempahan" className="btn btn-accent btn-lg w-full">
                  {t.detail.bookNow}
                  <ArrowRightIcon className="nudge size-[22px]" />
                </a>
                <Link href={inquireHref(pkg.slug)} className="btn btn-outline mt-3 w-full">
                  {t.detail.inquire}
                </Link>
              </>
            ) : (
              <Link href={inquireHref(pkg.slug)} className="btn btn-accent btn-lg w-full">
                {isBookable ? t.detail.inquireNow : t.detail.askNextTrip}
                <ArrowRightIcon className="nudge size-[22px]" />
              </Link>
            )}
            <a
              href={telHref(content.phone)}
              className="mt-2 flex min-h-12 items-center justify-center gap-2 text-meta font-bold text-primary underline decoration-transparent underline-offset-[0.2em] hover:decoration-current"
            >
              <PhoneIcon strokeWidth={2} className="size-[18px]" />
              {fmt(t.detail.orCall, { phone: content.phone })}
            </a>

            <p className="mt-2 flex items-start gap-2 border-t border-line pt-4 text-fine text-muted">
              <ShieldIcon strokeWidth={2} className="mt-0.5 size-[18px] shrink-0 text-primary" />
              {fmt(t.detail.trust, { licence: content.motac_license })}
            </p>
          </div>
        </aside>

        <div className="min-w-0 lg:col-start-1">
          <Section title={t.detail.about} id="tentang">
            <p className="max-w-[60ch] leading-[1.65] whitespace-pre-line">{pkg.description}</p>
          </Section>

          {pkg.highlights.length > 0 && (
            <Section title={t.detail.highlights} id="tarikan">
              <ul className="max-w-[60ch] space-y-2.5">
                {pkg.highlights.map((item, i) => (
                  <li
                    key={i}
                    className="relative pl-6 before:absolute before:top-[0.62em] before:left-1 before:size-2 before:rounded-full before:bg-accent"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {pkg.inclusions.length > 0 && (
            <Section title={t.detail.included} id="termasuk">
              <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {pkg.inclusions.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckIcon strokeWidth={2.4} className="mt-1 size-5 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {pkg.exclusions.length > 0 && (
            <Section title={t.detail.excluded}>
              <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {pkg.exclusions.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CloseIcon strokeWidth={2.4} className="mt-1 size-5 shrink-0 text-danger" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {pkg.itinerary.length > 0 && (
            <Section title={t.detail.itinerary} id="itinerari">
              <ol className="border-t border-line">
                {pkg.itinerary.map((day) => (
                  <li key={day.id} className="flex flex-col gap-2.5 border-b border-line py-5 sm:flex-row sm:gap-5">
                    <span className="flex h-10 w-[92px] shrink-0 items-center justify-center rounded-lg bg-primary-dark text-fine font-bold whitespace-nowrap text-white">
                      {dayLabel(day.dayStart, day.dayEnd, t.duration)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="mb-1 text-lead tracking-[-0.01em] text-primary-dark">{day.title}</h3>
                      <p className="max-w-[60ch] whitespace-pre-line text-muted">{day.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {prices.length > 0 && (
            <Section title={t.prices.heading} id="prices">
              <div className="overflow-x-auto rounded-xl border border-line bg-white">
                <table className="w-full text-left">
                  <thead className="bg-canvas">
                    <tr className="text-meta font-bold text-primary-dark">
                      <th scope="col" className="px-4 py-3 sm:px-5">
                        {t.prices.type}
                      </th>
                      <th scope="col" className="px-4 py-3 text-right sm:px-5">
                        {t.prices.price}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.map((p) => (
                      <tr key={p.type} className="border-t border-line">
                        <th scope="row" className="px-4 py-3.5 font-bold sm:px-5">
                          {t.prices.types[p.type].label}
                          <span className="block text-meta font-normal text-muted">{t.prices.types[p.type].hint}</span>
                        </th>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap sm:px-5">
                          <span className="text-lead font-extrabold text-primary-dark tabular-nums">
                            {formatPrice(p.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 max-w-[60ch] text-muted">{content.price_note}</p>
            </Section>
          )}

          {canBook && (
            <section id="tempahan" className="pt-2">
              <h2 className="mb-2 text-display font-extrabold text-primary-dark">{t.client.booking.heading}</h2>
              <p className="mb-5 max-w-[60ch] text-muted">{t.client.booking.intro}</p>
              <BookingForm
                slug={pkg.slug}
                title={pkg.title}
                departures={bookingDepartures}
                options={bookingOptions}
                whatsapp={content.whatsapp}
              />
            </section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="section bg-canvas">
          <div className="wrap">
            <h2 id="related-title" className="h-section reveal mb-8">
              {t.detail.related}
            </h2>
            <PackageGrid packages={related} />
          </div>
        </section>
      )}
    </>
  );
}

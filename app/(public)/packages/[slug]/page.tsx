import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm, type BookingDeparture, type BookingOption } from "@/components/public/booking-form";
import { PackageGallery } from "@/components/public/package-gallery";
import { CheckIcon, ClockIcon, CloseIcon, PhoneIcon, ShieldIcon, UserIcon } from "@/components/ui/icons";
import { formatDate, formatPrice, formatTripDates } from "@/lib/format";
import { fmt } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { DEPARTURE_AVAILABILITY, PACKAGE_AVAILABILITY, dayLabel, durationLabel } from "@/lib/package-labels";
import { offeredPrices } from "@/lib/package-prices";
import { getPublishedPackage } from "@/lib/packages";
import { getPublicContent } from "@/lib/site-config";
import { inquireHref, telHref } from "@/lib/site-content";
import { canBookOnline } from "@/lib/validation/booking";

export async function generateMetadata({ params }: PageProps<"/packages/[slug]">): Promise<Metadata> {
  const pkg = await getPublishedPackage((await params).slug);
  if (!pkg) return { title: (await getDictionary()).meta.packageNotFound };
  return {
    title: pkg.title,
    description: pkg.description.slice(0, 160),
    openGraph: { title: pkg.title, images: pkg.images[0] ? [pkg.images[0].url] : undefined },
  };
}

/** PackageDetailPage [PKG-MTT-002-002] — mockup 3.2.2. */
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
  const bookingDepartures: BookingDeparture[] = pkg.departures.map((d) => ({
    date: d.departureDate.toISOString().slice(0, 10),
    label: formatTripDates(d.departureDate, pkg.durationDays, locale),
    availability: d.availability,
  }));

  return (
    <>
      <nav aria-label={t.detail.breadcrumb} className="border-b border-line bg-white py-3.5">
        <ol className="mx-auto flex max-w-[1160px] flex-wrap px-4 sm:px-8 items-center gap-x-1.5 text-sm text-muted">
          <li>
            <Link href="/" className="font-semibold text-primary">
              {t.detail.home}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/packages" className="font-semibold text-primary">
              {t.detail.packages}
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
            {t.categories[pkg.category]}
          </p>
          <h1 className="mb-2.5 text-[26px] text-primary-dark sm:text-[28px]">{pkg.title}</h1>
          <ul className="flex flex-wrap gap-x-[18px] gap-y-2 text-[15px] font-medium text-muted">
            {duration && (
              <li className="flex items-center gap-1.5">
                <ClockIcon className="size-[17px] text-primary" />
                {duration}
              </li>
            )}
            {roomsLabel && (
              <li className="flex items-center gap-1.5">
                <UserIcon className="size-[17px] text-primary" />
                {roomsLabel}
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <ShieldIcon className="size-[17px] text-primary" />
              {t.detail.motacPackage}
            </li>
          </ul>
        </header>

        <aside className="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="rounded-[14px] border border-line bg-white p-6 sm:p-[26px]">
            {pkg.fromPrice !== null ? (
              <>
                <p className="text-[15px] font-bold text-muted">{t.prices.startsFrom}</p>
                <p className="font-heading text-[30px] leading-tight font-bold text-primary-dark">
                  {formatPrice(pkg.fromPrice)}
                </p>
                <p className="text-sm text-muted">{t.prices.perPerson}</p>
                <a
                  href="#prices"
                  className="mb-4 inline-flex min-h-10 items-center text-[15px] font-semibold text-primary hover:underline"
                >
                  {t.prices.seeDetails}
                </a>
              </>
            ) : (
              <p className="mb-5 font-heading text-xl font-bold text-primary-dark">{t.prices.askForPrice}</p>
            )}

            {pkg.availability !== "OPEN" && (
              <p className={`mb-5 rounded-lg px-3.5 py-2.5 text-sm font-bold ${availability.className}`}>
                {t.availability[pkg.availability]}
              </p>
            )}

            <h2 className="mb-3 font-sans text-sm font-bold text-ink">{t.detail.departures}</h2>
            {pkg.departures.length > 0 ? (
              <ul className="mb-5 divide-y divide-line">
                {pkg.departures.map((d) => {
                  const pill = DEPARTURE_AVAILABILITY[d.availability];
                  return (
                    <li key={d.id} className="flex items-center justify-between py-2.5 text-[15px]">
                      <span>{formatDate(d.departureDate, {}, locale)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${pill.className}`}>
                        {t.departureAvailability[d.availability]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mb-5 text-[15px] text-muted">
                {t.detail.noDepartures}
              </p>
            )}

            {canBook ? (
              <>
                {/* Book (the form at the bottom), or just ask a question first. */}
                <a
                  href="#tempahan"
                  className="mb-3 flex min-h-14 items-center justify-center rounded-[10px] bg-accent px-5 text-[17px] font-bold text-white hover:bg-accent-dark"
                >
                  {t.detail.bookNow}
                </a>
                <Link
                  href={inquireHref(pkg.slug)}
                  className="mb-3.5 flex min-h-12 items-center justify-center rounded-[10px] border-[1.5px] border-primary px-5 font-bold text-primary hover:bg-primary-pale"
                >
                  {t.detail.inquire}
                </Link>
              </>
            ) : (
              <Link
                href={inquireHref(pkg.slug)}
                className="mb-3.5 flex min-h-14 items-center justify-center rounded-[10px] bg-accent px-5 text-[17px] font-bold text-white hover:bg-accent-dark"
              >
                {isBookable ? t.detail.inquireNow : t.detail.askNextTrip}
              </Link>
            )}
            <a
              href={telHref(content.phone)}
              className="mb-[18px] flex items-center justify-center gap-2 text-[15px] font-semibold text-primary"
            >
              <PhoneIcon className="size-4" />
              {fmt(t.detail.orCall, { phone: content.phone })}
            </a>

            <p className="flex items-start gap-2 border-t border-line pt-4 text-[13px] text-muted">
              <ShieldIcon className="mt-px size-4 shrink-0 text-primary" />
              {fmt(t.detail.trust, { licence: content.motac_license })}
            </p>
          </div>
        </aside>

        <div className="min-w-0 lg:col-start-1">
          <section className="mb-8">
            <h2 className="mb-3.5 text-xl text-primary-dark">{t.detail.about}</h2>
            <p className="leading-relaxed whitespace-pre-line text-muted">{pkg.description}</p>
          </section>

          {pkg.inclusions.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3.5 text-xl text-primary-dark">{t.detail.included}</h2>
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

          {pkg.exclusions.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3.5 text-xl text-primary-dark">{t.detail.excluded}</h2>
              <ul className="grid gap-x-7 gap-y-3 sm:grid-cols-2">
                {pkg.exclusions.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 font-medium">
                    <CloseIcon className="mt-1 size-[19px] shrink-0 text-danger" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pkg.itinerary.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-2 text-xl text-primary-dark">{t.detail.itinerary}</h2>
              <ol className="divide-y divide-line">
                {pkg.itinerary.map((day) => (
                  <li key={day.id} className="flex gap-4 py-[18px]">
                    <span className="flex h-10 w-[72px] shrink-0 items-center justify-center rounded-lg bg-primary-pale font-heading text-[13.5px] font-bold text-primary">
                      {dayLabel(day.dayStart, day.dayEnd, t.duration)}
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

          {prices.length > 0 && (
            <section id="prices" className="scroll-mt-6">
              <h2 className="mb-3.5 text-xl text-primary-dark">{t.prices.heading}</h2>
              <div className="overflow-x-auto rounded-xl border border-line bg-white">
                <table className="w-full text-left">
                  <thead className="bg-primary-pale">
                    <tr className="text-[15px] font-bold text-primary-dark">
                      <th scope="col" className="px-4 py-3 sm:px-5">
                        {t.prices.type}
                      </th>
                      <th scope="col" className="px-4 py-3 text-right sm:px-5">
                        {t.prices.price}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {prices.map((p) => (
                      <tr key={p.type}>
                        <th scope="row" className="px-4 py-3.5 font-semibold sm:px-5">
                          {t.prices.types[p.type].label}
                          <span className="block text-[15px] font-normal text-muted">{t.prices.types[p.type].hint}</span>
                        </th>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap sm:px-5">
                          <span className="font-heading text-lg font-bold text-primary-dark">{formatPrice(p.amount)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 leading-relaxed text-muted">{content.price_note}</p>
            </section>
          )}

          {canBook && (
            <section id="tempahan" className="mt-10 scroll-mt-6">
              <h2 className="mb-2 text-xl text-primary-dark">{t.client.booking.heading}</h2>
              <p className="mb-5 text-muted">{t.client.booking.intro}</p>
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
    </>
  );
}

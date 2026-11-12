import Link from "next/link";
import type { CSSProperties } from "react";
import { PackageImage } from "@/components/public/package-image";
import { CalendarIcon } from "@/components/ui/icons";
import { formatDate, formatPrice } from "@/lib/format";
import { fmt } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { PACKAGE_AVAILABILITY, durationLabel } from "@/lib/package-labels";
import type { PackageCardData } from "@/lib/packages";

/**
 * A card only has room for a highlight's name: "Bosphorus Cruise: belayar di
 * selat…" → "Bosphorus Cruise". A highlight without a colon or dash is shown
 * whole (the line is cut after two lines either way).
 */
const highlightName = (highlight: string) => highlight.split(/:| [-–—] /)[0].trim();

/**
 * One package: photo, "category · duration", title, the first three
 * highlights, the starting price and the next departure. The whole card is
 * a single link to the package page, and lifts slightly under the pointer.
 */
export async function PackageCard({ pkg, heading: Heading = "h3" }: { pkg: PackageCardData; heading?: "h2" | "h3" }) {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const duration = durationLabel(pkg.durationDays, pkg.durationNights, t.duration);
  const availability = pkg.availability === "OPEN" ? null : PACKAGE_AVAILABILITY[pkg.availability];

  return (
    <Link
      href={`/packages/${pkg.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white text-left text-ink transition-[border-color,box-shadow,transform] duration-250 ease-smooth hover:-translate-y-[3px] hover:border-primary hover:shadow-lift"
    >
      <PackageImage
        src={pkg.imageUrl}
        alt=""
        sizes="(min-width: 900px) 400px, (min-width: 640px) 50vw, 100vw"
        className="aspect-video"
        imageClassName="transition-transform duration-250 ease-smooth group-hover:scale-[1.03]"
      />

      <div className="flex flex-1 flex-col px-[22px] pt-5 pb-[22px]">
        <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-meta text-muted">
          <span>
            {t.categories[pkg.category]}
            {duration && ` · ${duration}`}
          </span>
          {availability && (
            <span className={`rounded-full px-2.5 py-0.5 text-fine font-bold ${availability.className}`}>
              {t.availability[pkg.availability]}
            </span>
          )}
        </p>

        <Heading className="mt-1.5 text-title tracking-[-0.01em] text-primary-dark">{pkg.title}</Heading>

        {pkg.highlights.length > 0 && (
          <p className="mt-2.5 line-clamp-2 text-meta leading-normal text-muted">
            {pkg.highlights.slice(0, 3).map(highlightName).join(" · ")}
          </p>
        )}

        {/* Price, then the next departure under it: the same in every card, whatever their lengths. */}
        <div className="mt-auto space-y-2 pt-[18px]">
          {pkg.fromPrice !== null ? (
            <p className="leading-tight">
              <span className="block text-fine text-muted">{t.prices.startsFrom}</span>
              <strong className="text-price font-extrabold tracking-[-0.01em] text-primary-dark">
                {formatPrice(pkg.fromPrice)}
              </strong>{" "}
              <span className="text-fine text-muted">{t.prices.perPax}</span>
            </p>
          ) : (
            <p className="font-bold text-primary-dark">{t.prices.askForPrice}</p>
          )}
          {pkg.nextDeparture && (
            <p className="flex items-center gap-1.5 text-fine text-muted">
              <CalendarIcon className="size-[18px] shrink-0 text-primary" />
              <span>
                {fmt(t.card.nextDeparture, {
                  date: formatDate(pkg.nextDeparture, { day: "numeric" }, locale),
                })}
              </span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * Three across on computers, two on tablets, one on phones. `heading` is the
 * level of each card's title: h3 under a section heading (the default), h2
 * where the cards come straight after the page title.
 */
export function PackageGrid({ packages, heading }: { packages: PackageCardData[]; heading?: "h2" | "h3" }) {
  return (
    <ul className="grid gap-7 sm:grid-cols-2 mid:grid-cols-3">
      {packages.map((pkg, i) => (
        <li key={pkg.id} className="reveal" style={{ "--i": i % 3 } as CSSProperties}>
          <PackageCard pkg={pkg} heading={heading} />
        </li>
      ))}
    </ul>
  );
}

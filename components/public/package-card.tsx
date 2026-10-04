import Link from "next/link";
import { PackageImage } from "@/components/public/package-image";
import { formatPrice } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import { PACKAGE_AVAILABILITY } from "@/lib/package-labels";
import type { PackageCardData } from "@/lib/packages";
import { inquireHref } from "@/lib/site-content";

export async function PackageCard({ pkg }: { pkg: PackageCardData }) {
  const t = await getDictionary();
  const href = `/packages/${pkg.slug}`;
  const availability = pkg.availability === "OPEN" ? null : PACKAGE_AVAILABILITY[pkg.availability];

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-white text-left">
      <Link href={href} tabIndex={-1} aria-hidden="true">
        <PackageImage
          src={pkg.imageUrl}
          alt=""
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          className="aspect-video"
        />
      </Link>

      <div className="flex flex-1 flex-col p-[22px]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[13px] font-bold tracking-wide text-accent-dark">
            {t.categories[pkg.category]}
          </span>
          {availability && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${availability.className}`}>
              {t.availability[pkg.availability]}
            </span>
          )}
        </div>

        <h3 className="mb-2 text-[19px] text-primary-dark">
          <Link href={href} className="hover:underline">
            {pkg.title}
          </Link>
        </h3>
        {pkg.fromPrice !== null ? (
          <p className="mb-3 leading-tight">
            <span className="block text-[13px] font-bold text-muted">{t.prices.startsFrom}</span>
            <span className="font-heading text-xl font-bold text-primary">{formatPrice(pkg.fromPrice)}</span>{" "}
            <span className="text-sm font-medium text-muted">{t.prices.perPax}</span>
          </p>
        ) : (
          <p className="mb-3 text-base font-bold text-primary">{t.prices.askForPrice}</p>
        )}

        {pkg.highlights.length > 0 && (
          <>
            <p className="mb-1.5 text-[13px] font-bold text-muted">{t.card.highlights}</p>
            <ul className="mb-5 space-y-1.5">
              {pkg.highlights.slice(0, 3).map((h) => (
                <li
                  key={h}
                  className="relative pl-4 text-[15px] leading-snug text-muted before:absolute before:left-0 before:text-accent before:content-['•']"
                >
                  {h}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-auto flex gap-2.5">
          <Link
            href={href}
            className="flex min-h-12 flex-1 items-center justify-center rounded-lg border-[1.5px] border-primary px-3 text-[15px] font-bold text-primary hover:bg-primary-pale"
          >
            {t.card.viewDetails}
          </Link>
          <Link
            href={inquireHref(pkg.slug)}
            className="flex min-h-12 flex-1 items-center justify-center rounded-lg bg-accent px-3 text-[15px] font-bold text-white hover:bg-accent-dark"
          >
            {t.card.inquire}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function PackageGrid({ packages }: { packages: PackageCardData[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} />
      ))}
    </div>
  );
}

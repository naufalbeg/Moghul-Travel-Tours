import Link from "next/link";
import { PackageImage } from "@/components/public/package-image";
import { formatPrice } from "@/lib/format";
import { CATEGORY_LABEL, PACKAGE_AVAILABILITY } from "@/lib/package-labels";
import type { PackageCardData } from "@/lib/packages";
import { inquireUrl } from "@/lib/site";

export function PackageCard({ pkg }: { pkg: PackageCardData }) {
  const href = `/packages/${pkg.slug}`;
  const availability = pkg.availability === "OPEN" ? null : PACKAGE_AVAILABILITY[pkg.availability];

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-white text-left">
      <Link href={href} tabIndex={-1} aria-hidden="true">
        <PackageImage
          src={pkg.imageUrl}
          alt=""
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          className="aspect-[16/10]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-[22px]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[13px] font-bold tracking-wide text-accent-dark">
            {CATEGORY_LABEL[pkg.category]}
          </span>
          {availability && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${availability.className}`}>
              {availability.label}
            </span>
          )}
        </div>

        <h3 className="mb-2 text-[19px] text-primary-dark">
          <Link href={href} className="hover:underline">
            {pkg.title}
          </Link>
        </h3>
        <p className="mb-3 text-base font-bold text-primary">From {formatPrice(pkg.price)} per pax</p>

        {pkg.highlights.length > 0 && (
          <>
            <p className="mb-1.5 text-[13px] font-bold text-muted">Highlights</p>
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
            View details
          </Link>
          <a
            href={inquireUrl(pkg.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 flex-1 items-center justify-center rounded-lg bg-accent px-3 text-[15px] font-bold text-white hover:bg-accent-dark"
          >
            Inquire
          </a>
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

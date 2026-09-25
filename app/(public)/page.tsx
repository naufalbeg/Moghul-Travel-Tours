import Image from "next/image";
import Link from "next/link";
import { CategoryPills } from "@/components/public/category-pills";
import { PackageGrid } from "@/components/public/package-card";
import { PackageSearch } from "@/components/public/package-search";
import { ShieldIcon, WhatsAppIcon } from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo-mark";
import { listPublishedPackages } from "@/lib/packages";
import { prisma } from "@/lib/prisma";
import { SITE, whatsappUrl } from "@/lib/site";

/** Homepage — mockup "moghul-homepage-mockup-v2". */
export default async function HomePage() {
  // listPublishedPackages opts the page into per-request rendering, so the
  // other queries below are fresh too.
  const featured = await listPublishedPackages({ take: 3 });
  const [photos, testimonial] = await Promise.all([
    prisma.galleryImage.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, url: true, tag: true },
    }),
    prisma.testimonial.findFirst({
      orderBy: { createdAt: "desc" },
      select: { customerName: true, tripName: true, reviewText: true, starRating: true },
    }),
  ]);

  return (
    <>
      <section className="bg-hero px-4 pt-14 pb-[110px] text-center sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-[720px]">
          <h1 className="mb-[18px] text-[28px] tracking-[0.01em] text-white uppercase sm:text-[40px]">
            Go beyond the ordinary — find your ideal journey
          </h1>
          <p className="mx-auto max-w-[560px] text-lg text-white/88 sm:text-[19px]">
            Umrah, Ziarah, and family tours planned with care, backed by over a decade of
            experience and a team you can actually reach.
          </p>
        </div>
      </section>

      <div className="px-4 sm:px-8">
        <PackageSearch />
      </div>

      <section className="mx-auto max-w-[1160px] px-4 pt-14 pb-16 text-center sm:px-8">
        <h2 className="mb-2.5 text-[26px] text-primary-dark sm:text-[28px]">Featured travel packages</h2>
        <p className="mb-8 text-lg tracking-[3px] text-accent" aria-hidden="true">
          ★★★★★
        </p>
        <div className="mb-9">
          <CategoryPills active={null} allLabel="All" />
        </div>

        {featured.length > 0 ? (
          <>
            <PackageGrid packages={featured} />
            <Link
              href="/packages"
              className="mt-10 inline-flex min-h-12 items-center rounded-lg border-[1.5px] border-primary px-7 font-bold text-primary hover:bg-primary-pale"
            >
              View all packages
            </Link>
          </>
        ) : (
          <div className="mx-auto max-w-[560px] rounded-xl border border-line bg-white px-6 py-10">
            <p className="mb-6 text-muted">
              Our upcoming packages are being finalised. Message us and we&apos;ll share the latest
              Umrah, Ziarah and tour dates with you.
            </p>
            <a
              href={whatsappUrl("Hi Moghul Travel & Tours, I'd like to know about your upcoming packages.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#1f9d55] px-6 font-bold text-white"
            >
              <WhatsAppIcon className="size-5" />
              Ask us on WhatsApp
            </a>
          </div>
        )}
      </section>

      <section className="border-t border-line bg-white px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-[1160px]">
          {(photos.length > 0 || testimonial) && (
            <h2 className="mb-10 text-center text-[26px] text-primary-dark sm:text-[28px]">
              Our journeys &amp; client feedback
            </h2>
          )}

          {photos.length > 0 && (
            <div className="mb-14">
              <ul className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {photos.map((photo) => (
                  <li key={photo.id} className="relative h-44 overflow-hidden rounded-[10px] sm:h-60">
                    <Image
                      src={photo.url}
                      alt={photo.tag}
                      fill
                      sizes="(min-width: 1024px) 280px, 50vw"
                      className="object-cover"
                    />
                  </li>
                ))}
              </ul>
              <p className="mb-7 text-center text-[15px] text-muted">Capturing memories from our clients&apos; journeys</p>
              <div className="text-center">
                <Link
                  href="/gallery"
                  className="inline-flex min-h-12 items-center rounded-lg border-[1.5px] border-primary px-7 text-[15px] font-bold text-primary hover:bg-primary-pale"
                >
                  View full gallery
                </Link>
              </div>
            </div>
          )}

          {testimonial && (
            <figure className="mx-auto mb-14 max-w-[780px] rounded-[14px] bg-primary-pale px-6 py-9 text-center sm:px-10">
              <p className="font-heading text-[34px] leading-none text-accent" aria-hidden="true">
                &ldquo;
              </p>
              <p className="mt-1.5 mb-3.5 font-heading text-xl font-bold text-primary-dark">
                What our travellers say
              </p>
              <blockquote className="mb-3.5 text-lg italic sm:text-[19px]">{testimonial.reviewText}</blockquote>
              <p className="mb-2.5 text-[17px] tracking-[3px] text-accent" aria-label={`${testimonial.starRating} out of 5 stars`}>
                {"★".repeat(testimonial.starRating)}
              </p>
              <figcaption className="text-[15px] font-semibold text-muted">
                — {testimonial.customerName}, {testimonial.tripName}
              </figcaption>
            </figure>
          )}

          <div className="flex flex-col items-center gap-6 rounded-[14px] bg-canvas px-6 py-7 text-center sm:flex-row sm:gap-8 sm:px-8 sm:text-left">
            <LogoMark className="size-28 shrink-0 shadow-sm" imageClassName="size-20" />
            <div>
              <h2 className="mb-2 text-[19px] text-primary-dark">About {SITE.name}</h2>
              <p className="mb-3 text-base text-muted">
                A MOTAC licensed agency based in Shah Alam, focused on Umrah, Ziarah, and
                family-friendly tours — guiding Malaysian travellers to the places that matter to
                them for over a decade.
              </p>
              <p className="flex items-center justify-center gap-2 text-sm font-semibold text-primary-dark sm:justify-start">
                <ShieldIcon className="size-4 text-primary" />
                {SITE.motacLicense} · {SITE.companyReg}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

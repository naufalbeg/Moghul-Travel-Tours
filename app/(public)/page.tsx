import Image from "next/image";
import Link from "next/link";
import { BannerSlideshow } from "@/components/public/banner-slideshow";
import { CategoryPills } from "@/components/public/category-pills";
import { PackageGrid } from "@/components/public/package-card";
import { PackageSearch } from "@/components/public/package-search";
import { ShieldIcon, WhatsAppIcon } from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo-mark";
import { getBannerImages } from "@/lib/banner-images";
import { fmt } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { listPublishedPackages } from "@/lib/packages";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { getPublicContent } from "@/lib/site-config";
import { whatsappHref } from "@/lib/site-content";

/** Homepage — mockup "moghul-homepage-mockup-v2". */
export default async function HomePage() {
  // listPublishedPackages opts the page into per-request rendering, so the
  // other queries below are fresh too.
  const featured = await listPublishedPackages({ take: 3 });
  const [photos, testimonial, content, bannerImages, t] = await Promise.all([
    prisma.galleryImage.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, url: true, tag: true },
    }),
    prisma.testimonial.findFirst({
      orderBy: { createdAt: "desc" },
      select: { customerName: true, tripName: true, reviewText: true, starRating: true },
    }),
    getPublicContent(),
    getBannerImages("home"),
    getDictionary(),
  ]);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-hero px-4 pt-14 pb-[110px] text-center sm:px-8 sm:pt-16">
        {bannerImages.length > 0 && <BannerSlideshow images={bannerImages} />}
        <div className="mx-auto max-w-[720px]">
          <h1 className="mb-[18px] text-[28px] tracking-[0.01em] text-white uppercase sm:text-[40px]">
            {content.hero_title}
          </h1>
          <p className="mx-auto max-w-[560px] text-lg text-white/88 sm:text-[19px]">{content.hero_message}</p>
        </div>
      </section>

      <div className="px-4 sm:px-8">
        <PackageSearch />
      </div>

      <section className="mx-auto max-w-[1160px] px-4 pt-14 pb-16 text-center sm:px-8">
        <h2 className="mb-2.5 text-[26px] text-primary-dark sm:text-[28px]">{t.home.featured}</h2>
        <p className="mb-8 text-lg tracking-[3px] text-accent" aria-hidden="true">
          ★★★★★
        </p>
        <div className="mb-9">
          <CategoryPills active={null} allLabel={t.home.all} fromHomepage />
        </div>

        {featured.length > 0 ? (
          <>
            <PackageGrid packages={featured} />
            <Link
              href="/packages"
              className="mt-10 inline-flex min-h-12 items-center rounded-lg border-[1.5px] border-primary px-7 font-bold text-primary hover:bg-primary-pale"
            >
              {t.home.viewAll}
            </Link>
          </>
        ) : (
          <div className="mx-auto max-w-[560px] rounded-xl border border-line bg-white px-6 py-10">
            <p className="mb-6 text-muted">{t.home.noPackages}</p>
            <a
              href={whatsappHref(content, t.whatsapp.askUpcoming)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#1f9d55] px-6 font-bold text-white"
            >
              <WhatsAppIcon className="size-5" />
              {t.home.askWhatsApp}
            </a>
          </div>
        )}
      </section>

      <section className="border-t border-line bg-white px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-[1160px]">
          {(photos.length > 0 || testimonial) && (
            <h2 className="mb-10 text-center text-[26px] text-primary-dark sm:text-[28px]">
              {t.home.journeysHeading}
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
              <p className="mb-7 text-center text-[15px] text-muted">{t.home.photosCaption}</p>
              <div className="text-center">
                <Link
                  href="/gallery"
                  className="inline-flex min-h-12 items-center rounded-lg border-[1.5px] border-primary px-7 text-[15px] font-bold text-primary hover:bg-primary-pale"
                >
                  {t.home.viewGallery}
                </Link>
              </div>
            </div>
          )}

          {testimonial && (
            <div className="mb-14">
            <figure className="mx-auto mb-4 max-w-[780px] rounded-[14px] bg-primary-pale px-6 py-9 text-center sm:px-10">
              <p className="font-heading text-[34px] leading-none text-accent" aria-hidden="true">
                &ldquo;
              </p>
              <p className="mt-1.5 mb-3.5 font-heading text-xl font-bold text-primary-dark">
                {t.home.reviewHeading}
              </p>
              <blockquote className="mb-3.5 text-lg italic sm:text-[19px]">{testimonial.reviewText}</blockquote>
              <p className="mb-2.5 text-[17px] tracking-[3px] text-accent" aria-label={fmt(t.home.stars, { n: testimonial.starRating })}>
                {"★".repeat(testimonial.starRating)}
              </p>
              <figcaption className="text-[15px] font-semibold text-muted">
                — {testimonial.customerName}, {testimonial.tripName}
              </figcaption>
            </figure>
            <p className="text-center">
              <Link href="/testimonials" className="text-[15px] font-semibold text-primary hover:underline">
                {t.home.allReviews}
              </Link>
            </p>
            </div>
          )}

          <div className="flex flex-col items-center gap-6 rounded-[14px] bg-canvas px-6 py-7 text-center sm:flex-row sm:gap-8 sm:px-8 sm:text-left">
            <LogoMark className="h-24 shadow-sm sm:h-28" />
            <div>
              <h2 className="mb-2 text-[19px] text-primary-dark">{fmt(t.home.aboutHeading, { name: SITE.name })}</h2>
              <p className="mb-3 text-base text-muted">{content.about_summary}</p>
              <p className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-primary-dark sm:justify-start">
                <ShieldIcon className="size-4 text-primary" />
                {fmt(t.footer.motac, { value: content.motac_license })} ·{" "}
                {fmt(t.footer.companyReg, { value: content.company_reg })}
              </p>
              <Link href="/about" className="text-[15px] font-bold text-accent-dark hover:underline">
                {t.home.readStory}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

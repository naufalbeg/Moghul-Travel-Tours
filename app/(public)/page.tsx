import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { HeroSlideshow, type HeroSlide } from "@/components/public/hero-slideshow";
import { PackageGrid } from "@/components/public/package-card";
import { PackageSearch } from "@/components/public/package-search";
import { JsonLd } from "@/components/ui/json-ld";
import { Stars } from "@/components/ui/stars";
import {
  ArrowRightIcon,
  ClockIcon,
  ExternalIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import type { PackageCategory } from "@/generated/prisma/enums";
import { getBannerImages } from "@/lib/banner-images";
import { doorPhotoKey } from "@/lib/banners";
import { formatDate, formatPrice } from "@/lib/format";
import { fmt, type Locale } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n/ms";
import { durationLabel } from "@/lib/package-labels";
import { listPublishedPackages, type PackageCardData } from "@/lib/packages";
import { prisma } from "@/lib/prisma";
import { OTHER_PACKAGES_URL } from "@/lib/site";
import { getPublicContent } from "@/lib/site-config";
import { travelAgencyJsonLd } from "@/lib/structured-data";
import {
  lines,
  listItems,
  mapLinkUrl,
  splitHeadline,
  telHref,
  whatsappHref,
  type SiteContent,
} from "@/lib/site-content";

/** How many cover photos one visit's hero slideshow draws from. */
const HERO_SLIDES = 12;
const FEATURED = 6;
const DEPARTURES = 6;

/** Shown in the Umrah & Ziarah door until an admin photo or an Umrah package exists. */
const UMRAH_DOOR_FALLBACK = "/home/umrah-ziarah.jpg";

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

/** A new order on every visit (the page renders per request). */
function shuffled<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const countLabel = (n: number, one: string, many: string) => (n === 1 ? one : fmt(many, { n }));

/**
 * Homepage — mockup "moghul-homepage-mockup-v6". Top to bottom: navy hero
 * beside the package-photo slideshow, search, two category doors, featured
 * packages, the next departures, how booking works, customer trip photos,
 * who we are, reviews (once there are any), contact.
 */
export default async function HomePage() {
  // listPublishedPackages opts the page into per-request rendering, so the
  // other queries below are fresh too.
  const packages = await listPublishedPackages();
  const [photos, photoCount, reviews, content, umrahDoor, outboundDoor, t, locale] = await Promise.all([
    prisma.galleryImage.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, url: true, tag: true },
    }),
    prisma.galleryImage.count(),
    prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, customerName: true, tripName: true, reviewText: true, starRating: true },
    }),
    getPublicContent(),
    getBannerImages(doorPhotoKey("umrah-ziarah")),
    getBannerImages(doorPhotoKey("outbound")),
    getDictionary(),
    getLocale(),
  ]);

  const total = packages.length;
  const inCategory = (category: PackageCategory) => packages.filter((p) => p.category === category);
  const [headline, headlineAccent] = splitHeadline(content.hero_title);

  const slides: HeroSlide[] = shuffled(packages.filter((p) => p.imageUrl))
    .slice(0, HERO_SLIDES)
    .map((p) => ({
      src: p.imageUrl!,
      title: p.title,
      href: `/packages/${p.slug}`,
      meta: [
        durationLabel(p.durationDays, p.durationNights, t.duration),
        p.fromPrice !== null && fmt(t.home.fromPrice, { price: formatPrice(p.fromPrice) }),
      ]
        .filter(Boolean)
        .join(" · "),
    }));

  // "Berlesen MOTAC KPK/LN 9109 · ahli MATTA, MITA dan PAPUH · pejabat di Shah Alam"
  const memberships = [
    content.matta_member && "MATTA",
    content.mita_member && "MITA",
    content.papuh_member && "PAPUH",
  ].filter(Boolean) as string[];
  const trust = [
    fmt(t.home.trustLicence, { licence: content.motac_license }),
    memberships.length > 0 &&
      fmt(t.home.trustMembers, {
        list:
          memberships.length > 1
            ? `${memberships.slice(0, -1).join(", ")} ${t.layout.and} ${memberships.at(-1)}`
            : memberships[0],
      }),
    t.home.trustOffice,
  ]
    .filter(Boolean)
    .join(" · ");

  // Door photos: the admin's (Banners), else a package cover from that
  // category — one not already among the featured cards, where there is one.
  const coverFor = (category: PackageCategory) => {
    const covers = inCategory(category).filter((p) => p.imageUrl);
    return (covers[FEATURED] ?? covers.at(-1))?.imageUrl ?? null;
  };
  const umrah = inCategory("UMRAH_ZIARAH");
  const outbound = inCategory("OUTBOUND");

  // The next date of each package that can still be joined, soonest first.
  const departures = packages
    .filter((p) => p.nextDeparture && (p.availability === "OPEN" || p.availability === "ALMOST_FULL"))
    .sort((a, b) => a.nextDeparture!.getTime() - b.nextDeparture!.getTime())
    .slice(0, DEPARTURES);

  const credentials = [
    { label: t.home.credMotac, value: content.motac_license },
    { label: t.home.credCompanyReg, value: content.company_reg },
    { label: t.home.credMatta, value: content.matta_member },
    { label: t.home.credMita, value: content.mita_member },
    { label: t.home.credPapuh, value: content.papuh_member },
  ].filter((c) => c.value);

  return (
    <>
      <JsonLd data={travelAgencyJsonLd(content)} />
      <section className="on-dark bg-navy pt-[clamp(40px,5vw,72px)] pb-[clamp(104px,10vw,140px)] text-white">
        <div
          className={`wrap grid items-center gap-[clamp(32px,4.5vw,56px)] ${
            slides.length > 0 ? "mid:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" : ""
          }`}
        >
          <div>
            <h1 className="rise text-[36px] leading-[1.05] font-extrabold tracking-[-0.025em] text-white sm:text-[clamp(40px,4.6vw,66px)]">
              {headline}
              {headlineAccent && <span className="text-accent"> {headlineAccent}</span>}
            </h1>
            <p className="rise mt-[22px] max-w-[36ch] text-lead text-white/86" style={stagger(1)}>
              {content.hero_message}
            </p>
            <div className="rise mt-8 flex flex-wrap items-center gap-3" style={stagger(2)}>
              <a
                href={whatsappHref(content, t.whatsapp.planTrip)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-wa btn-lg max-sm:w-full"
              >
                <WhatsAppIcon className="size-[22px]" />
                {t.layout.whatsappUs}
              </a>
              <Link href="/packages" className="btn btn-ghost btn-lg max-sm:w-full">
                {total > 0 ? countLabel(total, t.home.viewOnePackage, t.home.viewPackages) : t.home.viewAllPackages}
                <ArrowRightIcon className="nudge size-[22px]" />
              </Link>
            </div>
            <p className="rise mt-7 flex max-w-[42ch] items-start gap-2.5 text-meta text-white/80" style={stagger(3)}>
              <ShieldIcon strokeWidth={2} className="mt-0.5 size-[22px] shrink-0 text-white" />
              <span>{trust}</span>
            </p>
          </div>

          {slides.length > 0 && (
            <div className="rise min-w-0" style={stagger(1.5)}>
              <HeroSlideshow slides={slides} label={t.home.slideshowLabel} />
            </div>
          )}
        </div>
      </section>

      {/* Search: overlaps the bottom edge of the hero. */}
      <section aria-labelledby="search-title" className="relative z-[2] mt-[clamp(-80px,-6vw,-56px)]">
        <div className="wrap">
          <h2 id="search-title" className="sr-only">
            {t.search.label}
          </h2>
          <PackageSearch suggestions={listItems(content.search_destinations)} />
        </div>
      </section>

      <section aria-labelledby="doors-title" className="section">
        <div className="wrap">
          <h2 id="doors-title" className="h-section reveal mb-8">
            {t.home.doorsHeading}
          </h2>
          <div className="grid gap-7 sm:grid-cols-2">
            <Door
              title={t.categories.UMRAH_ZIARAH}
              category={t.categories.UMRAH_ZIARAH}
              slug="umrah-ziarah"
              count={umrah.length}
              photo={umrahDoor[0]?.url ?? coverFor("UMRAH_ZIARAH") ?? UMRAH_DOOR_FALLBACK}
              content={content}
              t={t}
            />
            <Door
              title={t.home.doorOutbound}
              category={t.categories.OUTBOUND}
              slug="outbound"
              count={outbound.length}
              photo={outboundDoor[0]?.url ?? coverFor("OUTBOUND")}
              content={content}
              t={t}
              index={1}
            />
          </div>

          <ul className="reveal mt-10 grid border-t border-line mid:grid-cols-3 mid:gap-x-7">
            <DoorRow
              title={t.categories.INBOUND}
              count={inCategory("INBOUND").length}
              slug="inbound"
              ask={t.home.rowInboundAsk}
              askHref={whatsappHref(content, t.whatsapp.askInbound)}
              t={t}
            />
            <DoorRow
              title={t.categories.CRUISE}
              count={inCategory("CRUISE").length}
              slug="cruise"
              ask={t.home.rowCruiseAsk}
              askHref={whatsappHref(content, t.whatsapp.askCruise)}
              t={t}
            />
            <li>
              <a href={OTHER_PACKAGES_URL} target="_blank" rel="noopener" className={doorRowClass}>
                <span>
                  <strong className="block text-lead text-primary-dark">{t.client.nav.otherPackages}</strong>
                  <span className="block text-meta text-muted">{t.home.rowOther}</span>
                </span>
                <ExternalIcon strokeWidth={2} className="size-[22px] shrink-0 text-primary" />
                <span className="sr-only">{t.client.nav.newTab}</span>
              </a>
            </li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="featured-title" className="section bg-canvas">
        <div className="wrap">
          <div className="reveal mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <h2 id="featured-title" className="h-section">
              {t.home.featured}
            </h2>
            {total > FEATURED && (
              <Link href="/packages" className="arrow-link">
                {fmt(t.home.viewAllCount, { n: total })}
                <ArrowRightIcon className="nudge size-[22px]" />
              </Link>
            )}
          </div>

          {total > 0 ? (
            <PackageGrid packages={packages.slice(0, FEATURED)} />
          ) : (
            <div className="max-w-[60ch] rounded-xl border border-line bg-white px-6 py-8">
              <p className="mb-6 text-muted">{t.home.noPackages}</p>
              <a
                href={whatsappHref(content, t.whatsapp.askUpcoming)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-wa"
              >
                <WhatsAppIcon className="size-[22px]" />
                {t.home.askWhatsApp}
              </a>
            </div>
          )}
        </div>
      </section>

      {departures.length > 0 && (
        <section aria-labelledby="departures-title" className="section">
          <div className="wrap grid items-start gap-[clamp(32px,5vw,72px)] mid:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
            <div className="reveal">
              <h2 id="departures-title" className="h-section">
                {t.home.departuresHeading}
              </h2>
              <p className="mt-3 text-muted">{t.home.departuresIntro}</p>
              <Link href="/packages" className="arrow-link mt-4">
                {t.home.departuresAll}
                <ArrowRightIcon className="nudge size-[22px]" />
              </Link>
            </div>
            <ol className="reveal border-t border-line" style={stagger(1)}>
              {departures.map((pkg) => (
                <DepartureRow key={pkg.id} pkg={pkg} locale={locale} t={t} />
              ))}
            </ol>
          </div>
        </section>
      )}

      <section aria-labelledby="steps-title" className="section bg-canvas">
        <div className="wrap">
          <h2 id="steps-title" className="h-section reveal mb-8">
            {t.home.stepsHeading}
          </h2>
          {/* Numbers only, no icons. */}
          <ol className="grid gap-5 sm:grid-cols-3 mid:gap-7">
            {t.home.steps.map((step, i) => (
              <li key={step.title} className="reveal border-t-2 border-primary-dark pt-5" style={stagger(i)}>
                <span
                  aria-hidden="true"
                  className="block text-[44px] leading-none font-extrabold tracking-[-0.03em] text-primary-dark sm:text-[56px]"
                >
                  {i + 1}
                </span>
                <h3 className="mt-3.5 text-title tracking-[-0.01em] text-primary-dark">{step.title}</h3>
                <p className="mt-2 max-w-[38ch] text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="reveal mt-8 flex items-start gap-2.5 font-bold text-primary-dark">
            <ShieldIcon strokeWidth={2} className="mt-[3px] size-[22px] shrink-0 text-whatsapp" />
            {t.client.booking.noPayment}
          </p>
        </div>
      </section>

      {photos.length > 0 && (
        <section aria-labelledby="proof-title" className="on-dark section bg-navy text-white">
          <div className="wrap">
            <div className="reveal mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <div>
                <h2 id="proof-title" className="h-section">
                  {t.home.proofHeading}
                </h2>
                <p className="mt-2.5 max-w-[60ch] text-white/82">{t.home.proofText}</p>
              </div>
              <Link href="/gallery" className="arrow-link">
                {fmt(t.home.proofAll, { n: photoCount })}
                <ArrowRightIcon className="nudge size-[22px]" />
              </Link>
            </div>
            {/* The first photo is the large one. */}
            <ul className="reveal grid auto-rows-[150px] grid-cols-2 gap-3.5 sm:auto-rows-[200px] sm:grid-cols-4 mid:auto-rows-[230px]">
              {photos.map((photo, i) => (
                <li
                  key={photo.id}
                  className={`relative overflow-hidden rounded-xl bg-navy-deep ${i === 0 ? "col-span-2 row-span-2" : ""}`}
                >
                  <Image
                    src={photo.url}
                    alt={photo.tag}
                    fill
                    sizes={i === 0 ? "(min-width: 640px) 50vw, 100vw" : "(min-width: 640px) 25vw, 50vw"}
                    className="object-cover"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-3.5 left-3.5 max-w-[calc(100%-28px)] rounded-lg bg-navy/86 px-3 py-2 text-fine leading-[1.35] font-medium text-white"
                  >
                    {photo.tag}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section aria-labelledby="about-title" className="section">
        <div className="wrap grid items-center gap-[clamp(32px,5vw,72px)] mid:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="reveal">
            <h2 id="about-title" className="h-section">
              {t.home.aboutHeading}
            </h2>
            <p className="mt-4 max-w-[62ch]">{content.about_summary}</p>
            <Link href="/about" className="arrow-link mt-3">
              {t.home.readStory}
              <ArrowRightIcon className="nudge size-[22px]" />
            </Link>
          </div>
          <dl className="reveal grid border-t border-line sm:grid-cols-2 sm:gap-x-6" style={stagger(1)}>
            {credentials.map((c) => (
              <div key={c.label} className="border-b border-line py-3.5">
                <dt className="text-fine text-muted">{c.label}</dt>
                <dd className="font-bold text-primary-dark">{c.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {reviews.length > 0 && (
        <section aria-labelledby="reviews-title" className="section bg-canvas">
          <div className="wrap">
            <div className="reveal mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <div>
                <h2 id="reviews-title" className="h-section">
                  {t.home.reviewHeading}
                </h2>
                <p className="mt-2.5 max-w-[60ch] text-muted">{t.home.reviewText}</p>
              </div>
              <Link href="/testimonials" className="arrow-link">
                {t.home.allReviews}
                <ArrowRightIcon className="nudge size-[22px]" />
              </Link>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2 mid:grid-cols-3">
              {reviews.map((review, i) => (
                <li key={review.id} className="reveal" style={stagger(i)}>
                  <figure className="flex h-full flex-col rounded-xl border border-line bg-white p-6">
                    <Stars rating={review.starRating} label={fmt(t.home.stars, { n: review.starRating })} />
                    <blockquote className="mt-3 line-clamp-6 whitespace-pre-line">{review.reviewText}</blockquote>
                    <figcaption className="mt-auto pt-4 text-meta text-muted">
                      <strong className="block text-body text-primary-dark">{review.customerName}</strong>
                      {review.tripName}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section aria-labelledby="contact-title" className="section bg-primary-pale">
        <div className="wrap grid items-center gap-[clamp(32px,5vw,72px)] mid:grid-cols-2">
          <div className="reveal">
            <h2 id="contact-title" className="h-section text-[clamp(30px,3.4vw,44px)]">
              {t.home.contactHeading}
            </h2>
            <p className="mt-3.5 max-w-[44ch] text-muted">{t.home.contactText}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={whatsappHref(content, t.whatsapp.askTrip)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-wa btn-lg max-sm:w-full"
              >
                <WhatsAppIcon className="size-[22px]" />
                {t.layout.whatsappUs}
              </a>
              <a href={telHref(content.phone)} className="btn btn-primary btn-lg max-sm:w-full">
                <PhoneIcon strokeWidth={2} className="size-[22px]" />
                {fmt(t.home.callNumber, { number: content.phone })}
              </a>
            </div>
          </div>
          <ul className="reveal grid gap-[18px]" style={stagger(1)}>
            <ContactFact icon={<MapPinIcon strokeWidth={2} className={factIcon} />} title={t.footer.office}>
              {lines(content.address).join(", ")}
              <br />
              <a
                href={mapLinkUrl(content.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link inline-flex min-h-11 items-center"
              >
                {t.home.openMaps}
              </a>
            </ContactFact>
            <ContactFact icon={<ClockIcon strokeWidth={2} className={factIcon} />} title={t.footer.officeHours}>
              {lines(content.office_hours).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </ContactFact>
            <ContactFact icon={<MailIcon strokeWidth={2} className={factIcon} />} title={t.contact.email}>
              <a href={`mailto:${content.email}`} className="text-link inline-flex min-h-11 items-center">
                {content.email}
              </a>
            </ContactFact>
          </ul>
        </div>
      </section>
    </>
  );
}

const factIcon = "mt-[3px] size-[22px] text-primary";

function ContactFact({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
      {icon}
      <div>
        <strong className="block text-primary-dark">{title}</strong>
        {children}
      </div>
    </li>
  );
}

/**
 * One of the two large category "doors": a photo, the category, and either
 * its package count (the whole door links to that category) or, while no
 * package is published, a link to ask on WhatsApp.
 */
function Door({
  title,
  category,
  slug,
  count,
  photo,
  content,
  t,
  index = 0,
}: {
  title: string;
  category: string;
  slug: string;
  count: number;
  photo: string | null;
  content: SiteContent;
  t: Dictionary;
  index?: number;
}) {
  const linkClass = "arrow-link mt-1.5 after:absolute after:inset-0 after:content-['']";
  return (
    <article className="group reveal relative flex flex-col" style={stagger(index)}>
      <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-primary-pale">
        {photo ? (
          <Image
            src={photo}
            alt=""
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-250 ease-smooth group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <GlobeIcon className="size-14 text-primary opacity-55" />
          </div>
        )}
      </div>
      <h3 className="mt-5 text-display font-extrabold text-primary-dark">{title}</h3>
      {count > 0 ? (
        <>
          <p className="mt-2 max-w-[46ch] text-muted">{countLabel(count, t.home.doorOpenOne, t.home.doorOpen)}</p>
          <Link href={`/packages?category=${slug}`} className={linkClass}>
            {countLabel(count, t.home.viewOnePackage, t.home.viewPackages)}
            <ArrowRightIcon className="nudge size-[22px]" />
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 max-w-[46ch] text-muted">{fmt(t.home.doorSoon, { category })}</p>
          <a
            href={whatsappHref(content, fmt(t.whatsapp.askCategoryDates, { category }))}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {fmt(t.home.doorAsk, { category })}
            <ArrowRightIcon className="nudge size-[22px]" />
          </a>
        </>
      )}
    </article>
  );
}

const doorRowClass =
  "nudge-group flex min-h-[72px] items-center justify-between gap-3 border-b border-line py-3 text-ink";

/** A smaller category: its package count, or an invitation to ask on WhatsApp. */
function DoorRow({
  title,
  count,
  slug,
  ask,
  askHref,
  t,
}: {
  title: string;
  count: number;
  slug: string;
  ask: string;
  askHref: string;
  t: Dictionary;
}) {
  const body = (
    <>
      <span>
        <strong className="block text-lead text-primary-dark">{title}</strong>
        <span className="block text-meta text-muted">
          {count > 0 ? countLabel(count, t.home.doorOpenOne, t.home.doorOpen) : ask}
        </span>
      </span>
      <ArrowRightIcon className="nudge size-[22px] shrink-0 text-primary" />
    </>
  );
  return (
    <li>
      {count > 0 ? (
        <Link href={`/packages?category=${slug}`} className={doorRowClass}>
          {body}
        </Link>
      ) : (
        <a href={askHref} target="_blank" rel="noopener noreferrer" className={doorRowClass}>
          {body}
        </a>
      )}
    </li>
  );
}

/** One upcoming departure: a calendar tile, the package and its starting price. */
function DepartureRow({ pkg, locale, t }: { pkg: PackageCardData; locale: Locale; t: Dictionary }) {
  const date = pkg.nextDeparture!;
  // "dari {price}" with the price set in bold.
  const [beforePrice, afterPrice] = t.home.fromPrice.split("{price}");
  return (
    <li>
      <Link
        href={`/packages/${pkg.slug}`}
        className="group nudge-group grid min-h-24 grid-cols-[82px_minmax(0,1fr)_22px] items-center gap-x-3.5 gap-y-1 border-b border-line py-3 pr-3 text-ink transition-colors duration-150 ease-smooth hover:bg-canvas sm:grid-cols-[88px_minmax(0,1fr)_auto_22px] sm:gap-x-5"
      >
        <time
          dateTime={date.toISOString().slice(0, 10)}
          className="col-start-1 row-span-2 row-start-1 grid min-h-[72px] content-center justify-items-center rounded-lg bg-primary-dark px-1 py-2 leading-[1.15] text-white transition-colors duration-150 ease-smooth group-hover:bg-primary sm:row-span-1"
        >
          <span className="text-display font-extrabold tracking-[-0.02em] tabular-nums">{date.getUTCDate()}</span>
          <span className="text-fine font-bold whitespace-nowrap">{formatDate(date, { day: undefined }, locale)}</span>
        </time>
        <span className="col-start-2 row-start-1 self-end font-bold text-primary-dark sm:self-auto">{pkg.title}</span>
        {pkg.fromPrice !== null && (
          <span className="col-start-2 row-start-2 self-start text-meta whitespace-nowrap text-muted sm:col-start-3 sm:row-start-1 sm:self-auto sm:text-right">
            {beforePrice}
            <strong className="text-body text-ink tabular-nums">{formatPrice(pkg.fromPrice)}</strong>
            {afterPrice}
          </span>
        )}
        <ArrowRightIcon className="nudge col-start-3 row-span-2 row-start-1 size-[22px] text-primary sm:col-start-4 sm:row-span-1" />
      </Link>
    </li>
  );
}

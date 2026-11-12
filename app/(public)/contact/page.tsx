import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { InquiryForm } from "@/components/public/inquiry-form";
import { PageBanner } from "@/components/public/page-banner";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { listPackageOptions } from "@/lib/packages";
import { fmt } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getPublicContent } from "@/lib/site-config";
import { lines, mapEmbedUrl, mapLinkUrl, telHref, whatsappHref } from "@/lib/site-content";
import { GENERAL_INQUIRY } from "@/lib/validation/inquiry";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.meta.contactTitle, description: t.meta.contactDescription };
}

/** One way to reach the office: an icon, a heading and the details, separated by a rule. */
function Way({
  Icon,
  title,
  children,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 border-b border-line py-5 first:pt-0">
      <Icon strokeWidth={2} className="mt-[3px] size-[22px] text-primary" />
      <div className="min-w-0">
        <h2 className="mb-1 text-title text-primary-dark">{title}</h2>
        {children}
      </div>
    </section>
  );
}

const phoneLink =
  "inline-flex min-h-11 items-center text-lead font-bold text-primary underline decoration-transparent underline-offset-[0.2em] hover:decoration-current";

/** AboutContactPage [PKG-MTT-006-001] — Contact half. */
export default async function ContactPage() {
  const [content, packages, t, locale] = await Promise.all([
    getPublicContent(),
    listPackageOptions(),
    getDictionary(),
    getLocale(),
  ]);
  const address = lines(content.address);

  return (
    <>
      <PageBanner title={t.contact.title}>{t.contact.subtitle}</PageBanner>

      <div className="wrap grid items-start gap-[clamp(32px,5vw,72px)] pt-[clamp(40px,5vw,64px)] pb-[clamp(48px,6vw,80px)] mid:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div>
          <Way Icon={WhatsAppIcon} title="WhatsApp">
            <p className="mb-3 text-muted">{fmt(t.contact.whatsappText, { number: content.whatsapp })}</p>
            <a
              href={whatsappHref(content, t.whatsapp.askTrip)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-wa"
            >
              <WhatsAppIcon className="size-[22px]" />
              {t.contact.whatsappButton}
            </a>
          </Way>

          <Way Icon={PhoneIcon} title={t.contact.callHeading}>
            <ul>
              <li>
                <span className="text-muted">{t.contact.office}</span>
                <a href={telHref(content.phone)} className={phoneLink}>
                  {content.phone}
                </a>
              </li>
              {content.mobile && (
                <li>
                  <span className="text-muted">{t.contact.mobile}</span>
                  <a href={telHref(content.mobile)} className={phoneLink}>
                    {content.mobile}
                  </a>
                </li>
              )}
            </ul>
          </Way>

          <Way Icon={MailIcon} title={t.contact.email}>
            <ul>
              {[content.email, content.alt_email].filter(Boolean).map((email) => (
                <li key={email}>
                  <a href={`mailto:${email}`} className="text-link inline-flex min-h-11 items-center break-all">
                    {email}
                  </a>
                </li>
              ))}
            </ul>
          </Way>

          <Way Icon={ClockIcon} title={t.contact.hours}>
            <ul>
              {lines(content.office_hours).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Way>

          <p className="pt-5 text-muted">
            {t.contact.lookingForTrip}{" "}
            <Link href="/packages" className="text-link">
              {t.contact.browse}
            </Link>
          </p>
        </div>

        <section aria-labelledby="visit-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <h2 id="visit-heading" className="mb-1 text-title text-primary-dark">
                {t.contact.visit}
              </h2>
              <address className="not-italic">
                {address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
            <a
              href={mapLinkUrl(content.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
            >
              <MapPinIcon strokeWidth={2} className="size-5" />
              {t.contact.directions}
            </a>
          </div>
          <div className="overflow-hidden rounded-xl border border-line bg-canvas">
            <iframe
              src={mapEmbedUrl(content.address, locale)}
              title={fmt(t.contact.mapTitle, { address: address.join(", ") })}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block aspect-[4/3] w-full border-0"
            />
          </div>
        </section>
      </div>

      <section aria-labelledby="message-heading" className="bg-canvas py-[clamp(48px,6vw,80px)]">
        <div className="wrap">
          <div className="mx-auto max-w-[860px]">
            <h2 id="message-heading" className="h-section">
              {t.contact.messageHeading}
            </h2>
            <p className="mt-2.5 mb-7 text-muted">{t.contact.messageText}</p>
            <InquiryForm
              packages={packages.map((p) => p.title)}
              initialPackage={GENERAL_INQUIRY}
              whatsappUrl={whatsappHref(content, t.whatsapp.sentMessage)}
            />
          </div>
        </div>
      </section>
    </>
  );
}

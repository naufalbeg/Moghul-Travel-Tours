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

function Card({
  Icon,
  title,
  children,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex gap-4 rounded-xl border border-line bg-white p-5 sm:p-6">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-pale text-primary">
        <Icon className="size-[22px]" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="mb-1.5 text-lg text-primary-dark">{title}</h2>
        {children}
      </div>
    </section>
  );
}

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

      <div className="mx-auto grid max-w-[1160px] gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-4">
          <Card Icon={WhatsAppIcon} title="WhatsApp">
            <p className="mb-3 text-muted">{fmt(t.contact.whatsappText, { number: content.whatsapp })}</p>
            <a
              href={whatsappHref(content, t.whatsapp.askTrip)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#1f9d55] px-5 font-bold text-white"
            >
              <WhatsAppIcon className="size-5" />
              {t.contact.whatsappButton}
            </a>
          </Card>

          <Card Icon={PhoneIcon} title={t.contact.callHeading}>
            <ul className="space-y-2">
              <li>
                <span className="text-muted">{t.contact.office}</span>
                <a href={telHref(content.phone)} className="text-lg font-bold text-primary hover:underline">
                  {content.phone}
                </a>
              </li>
              {content.mobile && (
                <li>
                  <span className="text-muted">{t.contact.mobile}</span>
                  <a href={telHref(content.mobile)} className="text-lg font-bold text-primary hover:underline">
                    {content.mobile}
                  </a>
                </li>
              )}
            </ul>
          </Card>

          <Card Icon={MailIcon} title={t.contact.email}>
            <ul className="space-y-1">
              {[content.email, content.alt_email].filter(Boolean).map((email) => (
                <li key={email}>
                  <a href={`mailto:${email}`} className="font-semibold break-all text-primary hover:underline">
                    {email}
                  </a>
                </li>
              ))}
            </ul>
          </Card>

          <Card Icon={ClockIcon} title={t.contact.hours}>
            <ul className="text-muted">
              {lines(content.office_hours).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card Icon={MapPinIcon} title={t.contact.visit}>
            <address className="mb-3 text-muted not-italic">
              {address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <a
              href={mapLinkUrl(content.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-lg border-[1.5px] border-primary px-4 font-bold text-primary hover:bg-primary-pale"
            >
              {t.contact.directions}
            </a>
          </Card>
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <iframe
              src={mapEmbedUrl(content.address, locale)}
              title={fmt(t.contact.mapTitle, { address: address.join(", ") })}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block aspect-[4/3] w-full border-0"
            />
          </div>
          <p className="text-center text-[15px] text-muted">
            {t.contact.lookingForTrip}{" "}
            <Link href="/packages" className="font-semibold text-primary underline underline-offset-4">
              {t.contact.browse}
            </Link>
          </p>
        </div>
      </div>

      <section aria-labelledby="message-heading" className="mx-auto max-w-[860px] px-4 pb-16 sm:px-8">
        <h2 id="message-heading" className="mb-2 text-center text-[26px] text-primary-dark">
          {t.contact.messageHeading}
        </h2>
        <p className="mb-6 text-center text-muted">{t.contact.messageText}</p>
        <InquiryForm
          packages={packages.map((p) => p.title)}
          initialPackage={GENERAL_INQUIRY}
          whatsappUrl={whatsappHref(content, t.whatsapp.sentMessage)}
        />
      </section>
    </>
  );
}

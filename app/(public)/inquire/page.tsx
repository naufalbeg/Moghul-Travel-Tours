import type { Metadata } from "next";
import { InquiryForm } from "@/components/public/inquiry-form";
import { PageBanner } from "@/components/public/page-banner";
import { PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { listPackageOptions } from "@/lib/packages";
import { fmt } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { getPublicContent } from "@/lib/site-config";
import { telHref, whatsappHref } from "@/lib/site-content";
import { GENERAL_INQUIRY } from "@/lib/validation/inquiry";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.meta.inquireTitle, description: t.meta.inquireDescription };
}

/**
 * InquiryFormPage [PKG-MTT-003-001]. Arriving from a package's "Inquire"
 * button (?package=<slug>) pre-selects that package (SRS A1).
 */
export default async function InquirePage({ searchParams }: PageProps<"/inquire">) {
  const slug = (await searchParams).package;
  const [packages, content, t] = await Promise.all([listPackageOptions(), getPublicContent(), getDictionary()]);
  const selected = packages.find((p) => p.slug === slug)?.title ?? GENERAL_INQUIRY;

  return (
    <>
      <PageBanner title={t.inquire.title}>{t.inquire.subtitle}</PageBanner>

      <div className="wrap grid items-start gap-8 pt-10 pb-[clamp(56px,7vw,104px)] mid:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] mid:gap-10">
        <InquiryForm
          packages={packages.map((p) => p.title)}
          initialPackage={selected}
          whatsappUrl={whatsappHref(content, t.whatsapp.sentInquiry)}
        />

        <aside className="rounded-xl bg-canvas p-6 mid:sticky mid:top-[112px]">
          <h2 className="text-title text-primary-dark">{t.inquire.talkHeading}</h2>
          <p className="mt-2 mb-5 text-muted">{t.inquire.talkText}</p>
          <div className="flex flex-col gap-3">
            <a
              href={whatsappHref(content, t.whatsapp.askTrip)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-wa"
            >
              <WhatsAppIcon className="size-[22px]" />
              {fmt(t.inquire.whatsapp, { number: content.whatsapp })}
            </a>
            <a href={telHref(content.phone)} className="btn btn-primary">
              <PhoneIcon strokeWidth={2} className="size-[22px]" />
              {fmt(t.inquire.call, { number: content.phone })}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}

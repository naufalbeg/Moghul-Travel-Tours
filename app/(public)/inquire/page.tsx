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

      <div className="mx-auto grid max-w-[1160px] gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] lg:items-start">
        <InquiryForm
          packages={packages.map((p) => p.title)}
          initialPackage={selected}
          whatsappUrl={whatsappHref(content, t.whatsapp.sentInquiry)}
        />

        <aside className="rounded-xl bg-primary-pale p-6">
          <h2 className="mb-2 text-lg text-primary-dark">{t.inquire.talkHeading}</h2>
          <p className="mb-4 text-[15px] text-muted">{t.inquire.talkText}</p>
          <div className="flex flex-col gap-3">
            <a
              href={whatsappHref(content, t.whatsapp.askTrip)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#1f9d55] px-5 font-bold text-white"
            >
              <WhatsAppIcon className="size-5" />
              {fmt(t.inquire.whatsapp, { number: content.whatsapp })}
            </a>
            <a
              href={telHref(content.phone)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary bg-white px-5 font-bold text-primary"
            >
              <PhoneIcon className="size-5" />
              {fmt(t.inquire.call, { number: content.phone })}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}

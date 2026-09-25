import type { Metadata } from "next";
import { InquiryForm } from "@/components/public/inquiry-form";
import { PageBanner } from "@/components/public/page-banner";
import { PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { listPackageOptions } from "@/lib/packages";
import { getSiteContent } from "@/lib/site-config";
import { telHref, whatsappHref } from "@/lib/site-content";
import { GENERAL_INQUIRY } from "@/lib/validation/inquiry";

export const metadata: Metadata = {
  title: "Send an inquiry",
  description: "Ask Moghul Travel & Tours about a package — we'll get back to you shortly.",
};

/**
 * InquiryFormPage [PKG-MTT-003-001]. Arriving from a package's "Inquire"
 * button (?package=<slug>) pre-selects that package (SRS A1).
 */
export default async function InquirePage({ searchParams }: PageProps<"/inquire">) {
  const slug = (await searchParams).package;
  const [packages, content] = await Promise.all([listPackageOptions(), getSiteContent()]);
  const selected = packages.find((p) => p.slug === slug)?.title ?? GENERAL_INQUIRY;

  return (
    <>
      <PageBanner title="Send us an inquiry">
        Tell us what you&apos;re looking for and our team will get back to you shortly.
      </PageBanner>

      <div className="mx-auto grid max-w-[1160px] gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] lg:items-start">
        <InquiryForm
          packages={packages.map((p) => p.title)}
          initialPackage={selected}
          whatsappUrl={whatsappHref(content, "Hi Moghul Travel & Tours, I just sent an inquiry on your website.")}
        />

        <aside className="rounded-xl bg-primary-pale p-6">
          <h2 className="mb-2 text-lg text-primary-dark">Prefer to talk?</h2>
          <p className="mb-4 text-[15px] text-muted">We&apos;re happy to answer questions by phone or WhatsApp.</p>
          <div className="flex flex-col gap-3">
            <a
              href={whatsappHref(content, "Hi Moghul Travel & Tours, I'd like to ask about a trip.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#1f9d55] px-5 font-bold text-white"
            >
              <WhatsAppIcon className="size-5" />
              WhatsApp {content.whatsapp}
            </a>
            <a
              href={telHref(content.phone)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary bg-white px-5 font-bold text-primary"
            >
              <PhoneIcon className="size-5" />
              Call {content.phone}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}

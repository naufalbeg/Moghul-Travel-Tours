import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/public/page-banner";
import { CheckIcon, ShieldIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo-mark";
import { getSiteContent } from "@/lib/site-config";
import { paragraphs, whatsappHref } from "@/lib/site-content";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return { title: "About us", description: content.about_summary.slice(0, 160) };
}

/** AboutContactPage [PKG-MTT-006-001] — About half. */
export default async function AboutPage() {
  const content = await getSiteContent();
  const credentials = [
    `MOTAC License No. ${content.motac_license}`,
    `Co. Reg. No. ${content.company_reg}`,
    content.matta_member && `MATTA Member No. ${content.matta_member}`,
    "Based in Shah Alam, Selangor",
  ].filter(Boolean) as string[];

  return (
    <>
      <PageBanner title="About us">{content.about_summary}</PageBanner>

      <div className="mx-auto grid max-w-[1160px] gap-10 px-4 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start">
        <article className="rounded-xl border border-line bg-white px-6 py-8 sm:px-10">
          <Logo className="mb-8 h-auto w-full max-w-[300px]" />
          <div className="space-y-5 text-[17px] leading-relaxed">
            {paragraphs(content.about_story).map((p) => (
              <p key={p} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        </article>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <section className="rounded-xl border border-line bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg text-primary-dark">
              <ShieldIcon className="size-5 text-primary" />
              Licensed &amp; registered
            </h2>
            <ul className="space-y-2.5">
              {credentials.map((item) => (
                <li key={item} className="flex items-start gap-2.5 font-medium">
                  <CheckIcon className="mt-1 size-[18px] shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl bg-primary-pale p-6">
            <h2 className="mb-2 text-lg text-primary-dark">Plan your next journey with us</h2>
            <p className="mb-4 text-[15px] text-muted">
              Tell us where you&apos;d like to go and we&apos;ll help you find the right trip.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/packages"
                className="flex min-h-12 items-center justify-center rounded-lg bg-accent px-5 font-bold text-white hover:bg-accent-dark"
              >
                Browse packages
              </Link>
              <a
                href={whatsappHref(content, "Hi Moghul Travel & Tours, I'd like to plan a trip.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary bg-white px-5 font-bold text-primary"
              >
                <WhatsAppIcon className="size-5" />
                WhatsApp us
              </a>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

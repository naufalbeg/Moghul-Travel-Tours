import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/public/page-banner";
import { CheckIcon, ShieldIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo-mark";
import { fmt } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { getPublicContent } from "@/lib/site-config";
import { paragraphs, whatsappHref } from "@/lib/site-content";

export async function generateMetadata(): Promise<Metadata> {
  const [content, t] = await Promise.all([getPublicContent(), getDictionary()]);
  return { title: t.meta.aboutTitle, description: content.about_summary.slice(0, 160) };
}

/** AboutContactPage [PKG-MTT-006-001] — About half. */
export default async function AboutPage() {
  const [content, t] = await Promise.all([getPublicContent(), getDictionary()]);
  const credentials = [
    fmt(t.about.motac, { value: content.motac_license }),
    fmt(t.about.companyReg, { value: content.company_reg }),
    content.matta_member && fmt(t.about.matta, { value: content.matta_member }),
    content.mita_member && fmt(t.about.mita, { value: content.mita_member }),
    content.papuh_member && fmt(t.about.papuh, { value: content.papuh_member }),
    t.about.basedIn,
  ].filter(Boolean) as string[];

  return (
    <>
      <PageBanner title={t.about.title}>{content.about_summary}</PageBanner>

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
              {t.about.credentials}
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
            <h2 className="mb-2 text-lg text-primary-dark">{t.about.planHeading}</h2>
            <p className="mb-4 text-[15px] text-muted">{t.about.planText}</p>
            <div className="flex flex-col gap-3">
              <Link
                href="/packages"
                className="flex min-h-12 items-center justify-center rounded-lg bg-accent px-5 font-bold text-white hover:bg-accent-dark"
              >
                {t.about.browse}
              </Link>
              <a
                href={whatsappHref(content, t.whatsapp.planTrip)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary bg-white px-5 font-bold text-primary"
              >
                <WhatsAppIcon className="size-5" />
                {t.layout.whatsappUs}
              </a>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

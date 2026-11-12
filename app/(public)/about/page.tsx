import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/public/page-banner";
import { ArrowRightIcon, ShieldIcon, WhatsAppIcon } from "@/components/ui/icons";
import { getDictionary } from "@/lib/i18n/server";
import { getPublicContent } from "@/lib/site-config";
import { paragraphs, whatsappHref } from "@/lib/site-content";

export async function generateMetadata(): Promise<Metadata> {
  const [content, t] = await Promise.all([getPublicContent(), getDictionary()]);
  return { title: t.meta.aboutTitle, description: content.about_summary.slice(0, 160) };
}

/** AboutContactPage [PKG-MTT-006-001] — About half: the story, beside the licences and a way to start planning. */
export default async function AboutPage() {
  const [content, t] = await Promise.all([getPublicContent(), getDictionary()]);
  const credentials = [
    { label: t.home.credMotac, value: content.motac_license },
    { label: t.home.credCompanyReg, value: content.company_reg },
    { label: t.home.credMatta, value: content.matta_member },
    { label: t.home.credMita, value: content.mita_member },
    { label: t.home.credPapuh, value: content.papuh_member },
    { label: t.home.credAgent, value: "Muslim Travel Bug" },
  ].filter((c) => c.value);

  return (
    <>
      <PageBanner title={t.about.title}>{content.about_summary}</PageBanner>

      <div className="wrap grid items-start gap-[clamp(32px,5vw,72px)] pt-[clamp(40px,5vw,64px)] pb-[clamp(56px,7vw,104px)] mid:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <article className="max-w-[65ch] space-y-5 text-lead leading-[1.65]">
          {paragraphs(content.about_story).map((p) => (
            <p key={p} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </article>

        <aside className="space-y-8 mid:sticky mid:top-[112px]">
          <section aria-labelledby="credentials-title">
            <h2 id="credentials-title" className="mb-3 flex items-center gap-2 text-title text-primary-dark">
              <ShieldIcon strokeWidth={2} className="size-[22px] text-primary" />
              {t.about.credentials}
            </h2>
            <dl className="border-t border-line">
              {credentials.map((c) => (
                <div key={c.label} className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-line py-3">
                  <dt className="text-meta text-muted">{c.label}</dt>
                  <dd className="font-bold text-primary-dark">{c.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-meta text-muted">{t.about.basedIn}</p>
          </section>

          <section aria-labelledby="plan-title" className="rounded-xl bg-canvas p-6">
            <h2 id="plan-title" className="text-title text-primary-dark">
              {t.about.planHeading}
            </h2>
            <p className="mt-2 mb-5 text-muted">{t.about.planText}</p>
            <div className="flex flex-col gap-3">
              <Link href="/packages" className="btn btn-accent">
                {t.about.browse}
                <ArrowRightIcon className="nudge size-[22px]" />
              </Link>
              <a
                href={whatsappHref(content, t.whatsapp.planTrip)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-wa"
              >
                <WhatsAppIcon className="size-[22px]" />
                {t.layout.whatsappUs}
              </a>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

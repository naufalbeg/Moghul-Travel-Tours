import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/ui/logo-mark";
import { fmt } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { SITE } from "@/lib/site";
import { lines, telHref, whatsappHref, type SiteContent } from "@/lib/site-content";

const link = "text-white underline decoration-white/40 underline-offset-[0.2em] hover:decoration-white";

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-body font-bold tracking-normal text-white">{title}</h2>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  );
}

export async function SiteFooter({ content }: { content: SiteContent }) {
  const t = await getDictionary();
  // Only the social pages that have been filled in (admin: Content pages).
  const socialLinks = [
    { href: content.facebook_url, label: "Facebook" },
    { href: content.instagram_url, label: "Instagram" },
    { href: content.tiktok_url, label: "TikTok" },
  ].filter((social) => social.href);

  const licences = [
    fmt(t.footer.motac, { value: content.motac_license }),
    content.matta_member && fmt(t.footer.matta, { value: content.matta_member }),
    content.mita_member && fmt(t.footer.mita, { value: content.mita_member }),
    content.papuh_member && fmt(t.footer.papuh, { value: content.papuh_member }),
  ].filter(Boolean) as string[];

  return (
    <footer className="on-dark bg-navy pt-16 pb-8 text-meta text-white/86">
      <div className="wrap">
        <div className="grid gap-7 sm:grid-cols-2 sm:gap-10 lg:grid-cols-[1.3fr_1.4fr_0.9fr_1fr]">
          <div>
            <div className="flex items-center gap-3.5">
              <LogoMark className="h-16" />
              <p translate="no">
                <strong className="block text-lead text-white">{SITE.name}</strong>
                Sdn Bhd · {content.company_reg}
              </p>
            </div>
            <p className="mt-4 max-w-[38ch]">{t.footer.tagline}</p>
          </div>

          <Column title={t.footer.contactHeading}>
            <li>
              <address className="not-italic">{lines(content.address).join(", ")}</address>
            </li>
            <li>
              {t.footer.tel}{" "}
              <a href={telHref(content.phone)} className={link}>
                {content.phone}
              </a>
              {" · "}WhatsApp{" "}
              <a href={whatsappHref(content)} target="_blank" rel="noopener noreferrer" className={link}>
                {content.whatsapp}
              </a>
            </li>
            <li>
              <a href={`mailto:${content.email}`} className={link}>
                {content.email}
              </a>
              {content.alt_email && (
                <>
                  {" · "}
                  <a href={`mailto:${content.alt_email}`} className={link}>
                    {content.alt_email}
                  </a>
                </>
              )}
            </li>
            <li>{lines(content.office_hours).join(" · ")}</li>
          </Column>

          <Column title={t.footer.pagesHeading}>
            <li>
              <Link href="/packages" className={link}>
                {t.client.nav.packages}
              </Link>
            </li>
            <li>
              <Link href="/gallery" className={link}>
                {t.client.nav.gallery}
              </Link>
            </li>
            <li>
              <Link href="/testimonials" className={link}>
                {t.footer.reviewsLink}
              </Link>
            </li>
            <li>
              <Link href="/about" className={link}>
                {t.client.nav.about}
              </Link>
            </li>
            <li>
              <Link href="/contact" className={link}>
                {t.footer.contactLink}
              </Link>
            </li>
            {socialLinks.length > 0 && (
              <li>
                {socialLinks.map((social, i) => (
                  <span key={social.label}>
                    {i > 0 && " · "}
                    <a href={social.href} target="_blank" rel="noopener noreferrer" className={link}>
                      {social.label}
                    </a>
                  </span>
                ))}
              </li>
            )}
          </Column>

          <Column title={t.footer.licencesHeading}>
            {licences.map((licence) => (
              <li key={licence}>{licence}</li>
            ))}
          </Column>
        </div>

        <div className="mt-12 flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-white/16 pt-5 text-fine text-white/72">
          {/* These stay in English in both languages (owner's choice). */}
          <span lang="en">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </span>
          {/* Deliberately low-key: staff need it, visitors shouldn't be drawn to it. */}
          <Link href="/admin/login" lang="en" className="underline decoration-white/40 underline-offset-[0.2em] hover:text-white">
            Admin login
          </Link>
          <span lang="en">Developed by MNB</span>
        </div>
      </div>
    </footer>
  );
}

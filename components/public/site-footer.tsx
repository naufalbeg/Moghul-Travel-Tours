import Link from "next/link";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo-mark";
import { SITE } from "@/lib/site";
import { lines, telHref, whatsappHref, type SiteContent } from "@/lib/site-content";

const badge = "rounded-lg bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-white/90";

export function SiteFooter({ content }: { content: SiteContent }) {
  // Only show social links that have been filled in (admin: Content pages).
  const socialLinks = [
    { href: content.facebook_url, label: "Facebook", Icon: FacebookIcon },
    { href: content.instagram_url, label: "Instagram", Icon: InstagramIcon },
    { href: content.tiktok_url, label: "TikTok", Icon: TikTokIcon },
    { href: whatsappHref(content), label: "WhatsApp", Icon: WhatsAppIcon },
  ].filter((link) => link.href);

  // Extra bottom padding keeps the floating WhatsApp button off the text.
  return (
    <footer className="bg-primary-dark px-4 pt-12 pb-24 text-white sm:px-8">
      <div className="mx-auto mb-8 flex max-w-[1160px] flex-wrap justify-between gap-10">
        <div className="flex flex-[1_1_260px] items-center gap-3.5">
          <LogoMark className="h-14" />
          <div className="font-heading text-lg font-bold">
            {SITE.name}
            <span className="block font-sans text-sm font-normal text-white/65">Sdn Bhd</span>
          </div>
        </div>

        <address className="flex-[1_1_300px] space-y-2 text-[15px] not-italic text-white/85">
          <p>
            <strong className="text-white">Office</strong>
            {lines(content.address).map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <p>
            Tel/Fax:{" "}
            <a href={telHref(content.phone)} className="underline-offset-4 hover:underline">
              {content.phone}
            </a>
            {content.mobile && (
              <>
                {" · "}Mobile:{" "}
                <a href={telHref(content.mobile)} className="underline-offset-4 hover:underline">
                  {content.mobile}
                </a>
              </>
            )}
          </p>
          <p>
            <a href={`mailto:${content.email}`} className="underline-offset-4 hover:underline">
              {content.email}
            </a>
            {content.alt_email && (
              <>
                {" · "}
                <a href={`mailto:${content.alt_email}`} className="underline-offset-4 hover:underline">
                  {content.alt_email}
                </a>
              </>
            )}
          </p>
          <p>Office hours: {lines(content.office_hours).join(" · ")}</p>
          <ul className="flex gap-2.5 pt-2">
            {socialLinks.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-11 items-center justify-center rounded-full bg-white/12 hover:bg-white/20"
                >
                  <Icon className="size-[18px]" />
                </a>
              </li>
            ))}
          </ul>
        </address>

        <div className="flex flex-[1_1_220px] flex-col items-start gap-2">
          <span className={badge}>MOTAC License No. {content.motac_license}</span>
          <span className={badge}>Co. Reg. No. {content.company_reg}</span>
          {content.matta_member && <span className={badge}>MATTA Member No. {content.matta_member}</span>}
          <Link href="/contact" className="mt-2 text-sm font-semibold text-white/85 underline-offset-4 hover:underline">
            Contact &amp; directions →
          </Link>
          <Link href="/testimonials" className="text-sm font-semibold text-white/85 underline-offset-4 hover:underline">
            Traveller reviews →
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1160px] flex-wrap justify-between gap-2.5 border-t border-white/15 pt-5 text-[13px] text-white/55">
        <span>
          © {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </span>
        <span>Developed by MNB</span>
      </div>
    </footer>
  );
}

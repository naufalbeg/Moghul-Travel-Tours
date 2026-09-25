import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo-mark";
import { SITE, whatsappUrl } from "@/lib/site";

const socialLinks = [
  { href: SITE.social.facebook, label: "Facebook", Icon: FacebookIcon },
  { href: SITE.social.instagram, label: "Instagram", Icon: InstagramIcon },
  { href: whatsappUrl(), label: "WhatsApp", Icon: WhatsAppIcon },
];

export function SiteFooter() {
  // Extra bottom padding keeps the floating WhatsApp button off the text.
  return (
    <footer className="bg-primary-dark px-4 pt-12 pb-24 text-white sm:px-8">
      <div className="mx-auto mb-8 flex max-w-[1160px] flex-wrap justify-between gap-10">
        <div className="flex flex-[1_1_260px] items-center gap-3.5">
          <LogoMark />
          <div className="font-heading text-lg font-bold">
            {SITE.name}
            <span className="block font-sans text-sm font-normal text-white/65">Sdn Bhd</span>
          </div>
        </div>

        <address className="flex-[1_1_300px] space-y-2 text-[15px] not-italic text-white/85">
          <p>
            <strong className="text-white">Office</strong>
            {SITE.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <p>
            Tel/Fax:{" "}
            <a href={`tel:+${SITE.phoneIntl}`} className="underline-offset-4 hover:underline">
              {SITE.phone}
            </a>
            {" · "}Mobile:{" "}
            <a href={`tel:+${SITE.mobileIntl}`} className="underline-offset-4 hover:underline">
              {SITE.mobile}
            </a>
          </p>
          <p>
            <a href={`mailto:${SITE.email}`} className="underline-offset-4 hover:underline">
              {SITE.email}
            </a>
            {" · "}
            <a href={`mailto:${SITE.altEmail}`} className="underline-offset-4 hover:underline">
              {SITE.altEmail}
            </a>
          </p>
          <p>Office hours: {SITE.officeHours}</p>
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
          <span className="rounded-lg bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-white/90">
            {SITE.motacLicense}
          </span>
          <span className="rounded-lg bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-white/90">
            {SITE.companyReg}
          </span>
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

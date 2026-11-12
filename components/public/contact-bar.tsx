import { PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { getDictionary } from "@/lib/i18n/server";
import { telHref, whatsappHref, type SiteContent } from "@/lib/site-content";

/**
 * Phones only: WhatsApp | Telefon pinned to the bottom of the screen, so
 * help is always one tap away. Wider screens have the WhatsApp button in the
 * header, which stays in view. The public layout leaves room for this bar.
 */
export async function ContactBar({ content }: { content: SiteContent }) {
  const t = await getDictionary();
  return (
    <div
      role="region"
      aria-label={t.layout.contactBar}
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1.4fr_1fr] gap-2.5 border-t border-line bg-white px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgb(13_44_78/0.1)] sm:hidden"
    >
      <a
        href={whatsappHref(content, t.whatsapp.askPackage)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-wa px-3"
      >
        <WhatsAppIcon className="size-[22px]" />
        WhatsApp
      </a>
      <a href={telHref(content.phone)} className="btn btn-primary px-3">
        <PhoneIcon className="size-[22px]" />
        {t.layout.call}
      </a>
    </div>
  );
}

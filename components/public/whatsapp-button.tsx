import { WhatsAppIcon } from "@/components/ui/icons";
import { whatsappHref, type SiteContent } from "@/lib/site-content";

/** Floating contact button so help is always one tap away. */
export function WhatsAppButton({ content }: { content: SiteContent }) {
  return (
    <a
      href={whatsappHref(content, "Hi Moghul Travel & Tours, I'd like to ask about a package.")}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-4 z-30 flex min-h-14 items-center gap-2.5 rounded-full bg-[#1f9d55] px-5 font-bold text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-6" />
      <span>
        WhatsApp <span className="hidden sm:inline">us</span>
      </span>
    </a>
  );
}

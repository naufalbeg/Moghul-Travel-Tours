import Link from "next/link";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { WhatsAppIcon } from "@/components/ui/icons";
import { whatsappUrl } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-20 text-center">
        <div className="max-w-[520px]">
          <h1 className="mb-3 text-[28px] text-primary-dark">Page not found</h1>
          <p className="mb-8 text-muted">
            This page doesn&apos;t exist, or it may have moved. You can browse our packages, or
            message us and we&apos;ll point you in the right direction.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/packages"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-6 font-bold text-white hover:bg-accent-dark"
            >
              Browse packages
            </Link>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary px-6 font-bold text-primary"
            >
              <WhatsAppIcon className="size-5" />
              WhatsApp us
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

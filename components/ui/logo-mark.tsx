import Image from "next/image";
import logo from "@/public/brand/moghul-logo.png";
import mark from "@/public/brand/moghul-mark.png";
import { SITE } from "@/lib/site";

/**
 * The logo's globe with its orange swoosh and plane, on a white badge (the
 * dark-blue globe needs a light background). Size it by height, e.g.
 * className="h-12"; the width follows the mark's proportions.
 */
export function LogoMark({ className = "h-12" }: { className?: string }) {
  return (
    <span className={`relative block aspect-[8/5] shrink-0 rounded-xl bg-white ${className}`}>
      <Image src={mark} alt="" fill sizes="180px" className="object-contain p-[9%]" />
    </span>
  );
}

/**
 * The full company logo (wordmark, reg. no. and licence). It has a white
 * background baked in, so only place it on white surfaces.
 */
export function Logo({ className = "h-16 w-auto", priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={logo}
      alt={SITE.legalName}
      className={className}
      priority={priority}
      sizes="(min-width: 1024px) 300px, 200px"
    />
  );
}

import Image from "next/image";
import globe from "@/public/brand/moghul-globe.png";
import logo from "@/public/brand/moghul-logo.png";
import { SITE } from "@/lib/site";

/** The globe from the company logo, in a round badge. For tight spaces. */
export function LogoMark({
  className = "size-12",
  imageClassName = "size-[34px]",
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-white ${className}`}
    >
      <Image src={globe} alt="" className={imageClassName} />
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

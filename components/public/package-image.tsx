import Image from "next/image";
import { ImageIcon } from "@/components/ui/icons";

/** A package photo, or the mockups' soft-blue placeholder when there is none. */
export function PackageImage({
  src,
  alt,
  sizes,
  priority,
  className = "",
  iconClassName = "size-9",
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-linear-135 from-primary-pale to-[#cfe1f2] ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <ImageIcon className={`text-primary opacity-55 ${iconClassName}`} />
        </div>
      )}
    </div>
  );
}

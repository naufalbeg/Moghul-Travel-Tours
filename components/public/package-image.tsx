import Image from "next/image";
import { ImageIcon } from "@/components/ui/icons";

/** A package photo, or a soft-blue placeholder when there is none. `priority` = the page's first photo. */
export function PackageImage({
  src,
  alt,
  sizes,
  priority,
  className = "",
  imageClassName = "",
  iconClassName = "size-9",
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Extra classes for the photo itself (e.g. a hover zoom). */
  imageClassName?: string;
  iconClassName?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-primary-pale ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          loading={priority ? "eager" : undefined}
          fetchPriority={priority ? "high" : undefined}
          className={`object-cover ${imageClassName}`}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <ImageIcon className={`text-primary opacity-55 ${iconClassName}`} />
        </div>
      )}
    </div>
  );
}

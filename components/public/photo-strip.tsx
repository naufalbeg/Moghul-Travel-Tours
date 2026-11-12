import Image from "next/image";
import { fmt } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";

/**
 * A row of the newest customer trip photos from the gallery ("people prove
 * it") — on the About page and where the reviews will go. Renders nothing
 * when the gallery is empty. Call it from a page that already reads per
 * request.
 */
export async function PhotoStrip({ count = 4 }: { count?: number }) {
  const [photos, t] = await Promise.all([
    prisma.galleryImage.findMany({
      orderBy: { createdAt: "desc" },
      take: count,
      select: { id: true, url: true, tag: true },
    }),
    getDictionary(),
  ]);
  if (photos.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
      {photos.map((photo) => (
        <li key={photo.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-primary-pale">
          <Image
            src={photo.url}
            alt={fmt(t.gallery.photoAlt, { tag: photo.tag })}
            fill
            sizes="(min-width: 640px) 25vw, 50vw"
            className="object-cover"
          />
        </li>
      ))}
    </ul>
  );
}

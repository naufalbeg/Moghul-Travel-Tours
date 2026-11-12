import type { Metadata } from "next";
import Link from "next/link";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { PageBanner } from "@/components/public/page-banner";
import { pillClass } from "@/components/public/pill";
import { ArrowRightIcon } from "@/components/ui/icons";
import { listGalleryImages, listGalleryTags } from "@/lib/gallery";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.meta.galleryTitle, description: t.meta.galleryDescription };
}

/** GalleryPage [PKG-MTT-004-001] — grid, filter by destination tag, lightbox. */
export default async function GalleryPage({ searchParams }: PageProps<"/gallery">) {
  const tagParam = (await searchParams).tag;
  const [tags, t] = await Promise.all([listGalleryTags(), getDictionary()]);
  const activeTag = typeof tagParam === "string" && tags.some((t) => t.tag === tagParam) ? tagParam : undefined;
  const photos = await listGalleryImages(activeTag);

  return (
    <>
      <PageBanner title={t.gallery.title}>{t.gallery.subtitle}</PageBanner>

      <section className="wrap pt-10 pb-[clamp(56px,7vw,104px)]">
        {tags.length > 1 && (
          <nav aria-label={t.gallery.filterLabel} className="mb-8 flex flex-wrap gap-3">
            <Link href="/gallery" className={pillClass(!activeTag)} aria-current={!activeTag ? "page" : undefined}>
              {t.gallery.all}
            </Link>
            {tags.map((t) => (
              <Link
                key={t.tag}
                href={`/gallery?tag=${encodeURIComponent(t.tag)}`}
                className={pillClass(activeTag === t.tag)}
                aria-current={activeTag === t.tag ? "page" : undefined}
              >
                {t.tag}
              </Link>
            ))}
          </nav>
        )}

        {photos.length > 0 ? (
          <GalleryGrid photos={photos} />
        ) : (
          <div className="max-w-[60ch] rounded-xl border border-line bg-white px-6 py-8">
            <p className="mb-4 text-muted">{t.gallery.empty}</p>
            <Link href="/packages" className="arrow-link">
              {t.gallery.browse}
              <ArrowRightIcon className="nudge size-[22px]" />
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { PageBanner } from "@/components/public/page-banner";
import { tabClass, tabCountClass, tabListClass } from "@/components/ui/tabs";
import { ArrowRightIcon } from "@/components/ui/icons";
import { listGalleryImages, listGalleryTags } from "@/lib/gallery";
import { fmt } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: t.meta.galleryTitle,
    description: t.meta.galleryDescription,
    alternates: { canonical: "/gallery" },
  };
}

/** GalleryPage [PKG-MTT-004-001] — grid, filter by destination tag, lightbox. */
export default async function GalleryPage({ searchParams }: PageProps<"/gallery">) {
  const tagParam = (await searchParams).tag;
  const [tags, t] = await Promise.all([listGalleryTags(), getDictionary()]);
  const activeTag = typeof tagParam === "string" && tags.some((t) => t.tag === tagParam) ? tagParam : undefined;
  const photos = (await listGalleryImages(activeTag)).map((photo) => ({
    ...photo,
    alt: fmt(t.gallery.photoAlt, { tag: photo.tag }),
  }));
  const total = tags.reduce((sum, tag) => sum + tag.count, 0);

  return (
    <>
      <PageBanner title={t.gallery.title}>
        {total > 0 ? fmt(t.gallery.summary, { n: total, m: tags.length }) : t.gallery.subtitle}
      </PageBanner>

      <section className="wrap pt-10 pb-[clamp(56px,7vw,104px)]">
        {tags.length > 1 && (
          <nav aria-label={t.gallery.filterLabel} className={`${tabListClass} mb-8`}>
            <Link href="/gallery" className={tabClass(!activeTag)} aria-current={!activeTag ? "page" : undefined}>
              {t.gallery.all}
              <span className={tabCountClass}>{total}</span>
            </Link>
            {tags.map((t) => (
              <Link
                key={t.tag}
                href={`/gallery?tag=${encodeURIComponent(t.tag)}`}
                className={tabClass(activeTag === t.tag)}
                aria-current={activeTag === t.tag ? "page" : undefined}
              >
                {t.tag}
                <span className={tabCountClass}>{t.count}</span>
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

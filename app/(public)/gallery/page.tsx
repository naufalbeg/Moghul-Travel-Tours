import type { Metadata } from "next";
import Link from "next/link";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { PageBanner } from "@/components/public/page-banner";
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

  const pill = (active: boolean) =>
    `flex min-h-11 items-center rounded-full border-[1.5px] border-primary px-5 text-[15px] font-semibold ${
      active ? "bg-primary text-white" : "bg-white text-primary hover:bg-primary-pale"
    }`;

  return (
    <>
      <PageBanner title={t.gallery.title}>{t.gallery.subtitle}</PageBanner>

      <section className="mx-auto max-w-[1160px] px-4 py-10 sm:px-8 sm:py-14">
        {tags.length > 1 && (
          <nav aria-label={t.gallery.filterLabel} className="mb-8 flex flex-wrap justify-center gap-3">
            <Link href="/gallery" className={pill(!activeTag)} aria-current={!activeTag ? "page" : undefined}>
              {t.gallery.all}
            </Link>
            {tags.map((t) => (
              <Link
                key={t.tag}
                href={`/gallery?tag=${encodeURIComponent(t.tag)}`}
                className={pill(activeTag === t.tag)}
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
          <div className="mx-auto max-w-[520px] rounded-xl border border-line bg-white px-6 py-10 text-center">
            <p className="mb-5 text-muted">{t.gallery.empty}</p>
            <Link href="/packages" className="font-semibold text-primary underline underline-offset-4">
              {t.gallery.browse}
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

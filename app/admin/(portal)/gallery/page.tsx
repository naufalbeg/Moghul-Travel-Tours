import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { PageHeader } from "@/components/admin/field";
import { GalleryUploader } from "@/components/admin/gallery-uploader";
import { ExternalIcon, TrashIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth";
import { listGalleryImages, listGalleryTags } from "@/lib/gallery";
import { deleteGalleryImage } from "./actions";

export const metadata: Metadata = { title: "Gallery" };

/** AdminGalleryPanel [PKG-MTT-004-002] — upload, browse by label, delete. */
export default async function AdminGalleryPage({ searchParams }: PageProps<"/admin/gallery">) {
  await requireAdmin();
  const tagParam = (await searchParams).tag;
  const activeTag = typeof tagParam === "string" ? tagParam : undefined;
  const [tags, images] = await Promise.all([listGalleryTags(), listGalleryImages(activeTag)]);
  const total = tags.reduce((sum, t) => sum + t.count, 0);

  const pill = (active: boolean) =>
    `flex min-h-10 items-center rounded-full border-[1.5px] px-4 text-sm font-semibold ${
      active ? "border-primary bg-primary text-white" : "border-line bg-white hover:border-primary"
    }`;

  return (
    <>
      <PageHeader
        title="Gallery"
        subtitle="Trip photos shown on the Gallery page and the homepage."
        action={
          <Link href="/gallery" target="_blank" className="flex items-center gap-1.5 self-start text-sm font-semibold text-primary hover:underline">
            View the Gallery page <ExternalIcon className="size-3.5" />
          </Link>
        }
      />

      <GalleryUploader existingTags={tags.map((t) => t.tag)} />

      {total === 0 ? (
        <div className="rounded-xl border border-line bg-white px-6 py-14 text-center">
          <h3 className="mb-2 text-lg">No photos yet</h3>
          <p className="text-muted">Photos you upload appear here and on the public Gallery page straight away.</p>
        </div>
      ) : (
        <>
          <nav aria-label="Filter by label" className="mb-5 flex flex-wrap gap-2">
            <Link href="/admin/gallery" className={pill(!activeTag)} aria-current={!activeTag ? "page" : undefined}>
              All ({total})
            </Link>
            {tags.map((t) => (
              <Link
                key={t.tag}
                href={`/admin/gallery?tag=${encodeURIComponent(t.tag)}`}
                className={pill(activeTag === t.tag)}
                aria-current={activeTag === t.tag ? "page" : undefined}
              >
                {t.tag} ({t.count})
              </Link>
            ))}
          </nav>

          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {images.map((img) => (
              <li key={img.id} className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="relative aspect-[4/3] bg-primary-pale">
                  <Image src={img.url} alt={img.tag} fill sizes="(min-width: 1280px) 260px, 33vw" className="object-cover" />
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <span className="truncate text-sm font-semibold" title={img.tag}>
                    {img.tag}
                  </span>
                  <ConfirmActionButton
                    label="Delete"
                    icon={<TrashIcon className="size-3.5" />}
                    title="Delete this photo?"
                    confirmLabel="Delete photo"
                    action={deleteGalleryImage.bind(null, img.id)}
                  >
                    The photo will be removed from the website and deleted permanently.
                  </ConfirmActionButton>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

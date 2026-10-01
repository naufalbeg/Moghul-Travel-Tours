import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BannerPhotoAdder, BannerPhotoMove } from "@/components/admin/banner-photo-controls";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { PageHeader } from "@/components/admin/field";
import { ExternalIcon, TrashIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth";
import { BANNERS } from "@/lib/banners";
import { prisma } from "@/lib/prisma";
import { MAX_BANNER_IMAGES } from "@/lib/storage-config";
import { deleteBannerImage } from "./actions";

export const metadata: Metadata = { title: "Banners" };

/** Slideshow photos for the homepage and package-listing banners. */
export default async function AdminBannersPage() {
  await requireAdmin();
  const images = await prisma.bannerImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, banner: true, url: true },
  });

  return (
    <>
      <PageHeader
        title="Banners"
        subtitle={`Up to ${MAX_BANNER_IMAGES} photos per banner. They fade from one to the next every few seconds; with no photos, the banner stays plain blue.`}
      />

      <div className="space-y-5">
        {BANNERS.map((banner) => {
          const photos = images.filter((img) => img.banner === banner.key);
          return (
            <section key={banner.key} className="rounded-xl border border-line bg-white px-5 py-6 sm:px-8">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="mb-1 text-[17px]">{banner.label}</h3>
                  <p className="text-sm text-muted">
                    {photos.length === 0
                      ? "No photos — shows the plain blue banner."
                      : `${photos.length} of ${MAX_BANNER_IMAGES} photos, shown in this order.`}
                  </p>
                </div>
                <Link
                  href={banner.page}
                  target="_blank"
                  className="flex items-center gap-1.5 text-[13.5px] font-semibold text-primary hover:underline"
                >
                  View page <ExternalIcon className="size-3.5" />
                </Link>
              </div>

              {photos.length > 0 && (
                <ol className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {photos.map((img, i) => (
                    <li key={img.id} className="overflow-hidden rounded-lg border border-line">
                      <div className="relative aspect-[3/1] bg-primary-pale">
                        <Image src={img.url} alt="" fill sizes="(min-width: 1280px) 360px, 50vw" className="object-cover" />
                        <span className="absolute top-1.5 left-1.5 rounded-full bg-navy/75 px-2 py-0.5 text-xs font-bold text-white">
                          {i + 1}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 p-2.5">
                        <BannerPhotoMove id={img.id} isFirst={i === 0} isLast={i === photos.length - 1} />
                        <ConfirmActionButton
                          label="Remove"
                          icon={<TrashIcon className="size-3.5" />}
                          title="Remove this photo?"
                          confirmLabel="Remove photo"
                          action={deleteBannerImage.bind(null, img.id)}
                        >
                          It disappears from the {banner.label.toLowerCase()} banner straight away.
                        </ConfirmActionButton>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              <BannerPhotoAdder banner={banner.key} room={MAX_BANNER_IMAGES - photos.length} />
            </section>
          );
        })}
      </div>
    </>
  );
}

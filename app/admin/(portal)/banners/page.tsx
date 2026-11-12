import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BannerPhotoAdder, BannerPhotoMove } from "@/components/admin/banner-photo-controls";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { PageHeader } from "@/components/admin/field";
import { ExternalIcon, TrashIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth";
import { BANNERS, type BannerSlot } from "@/lib/banners";
import { prisma } from "@/lib/prisma";
import { deleteBannerImage } from "./actions";

export const metadata: Metadata = { title: "Banners" };

/** What a slot shows right now, in plain words. */
function status(slot: BannerSlot, count: number) {
  if (slot.kind === "door") {
    return count === 0
      ? "No photo chosen — the homepage shows a package photo from this category instead."
      : "This photo is shown on the homepage.";
  }
  return count === 0
    ? "No photos — shows the plain blue banner."
    : `${count} of ${slot.max} photos, shown in this order.`;
}

/**
 * Photos for the homepage's two category panels (one each) and the
 * slideshows behind the package-listing banners (up to five each).
 */
export default async function AdminBannersPage() {
  await requireAdmin();
  const images = await prisma.bannerImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, banner: true, url: true },
  });

  return (
    <>
      <PageHeader
        subtitle="The two category photos on the homepage, and the photos behind the banners on the Packages page (these fade from one to the next every few seconds)."
      />

      <div className="space-y-5">
        {BANNERS.map((slot) => {
          const photos = images.filter((img) => img.banner === slot.key);
          const single = slot.max === 1;
          return (
            <section key={slot.key} className="rounded-xl border border-line bg-white px-5 py-6 sm:px-8">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="mb-1 text-body">{slot.label}</h2>
                  <p className="text-sm text-muted">{status(slot, photos.length)}</p>
                </div>
                <Link
                  href={slot.page}
                  target="_blank"
                  className="flex min-h-9 items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                >
                  View page <ExternalIcon className="size-3.5" />
                </Link>
              </div>

              {photos.length > 0 && (
                <ol className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {photos.map((img, i) => (
                    <li key={img.id} className="overflow-hidden rounded-lg border border-line">
                      <div className={`relative bg-primary-pale ${single ? "aspect-[3/2]" : "aspect-[3/1]"}`}>
                        <Image src={img.url} alt="" fill sizes="(min-width: 1280px) 360px, 50vw" className="object-cover" />
                        {!single && (
                          <span className="absolute top-1.5 left-1.5 rounded-full bg-navy/80 px-2 py-0.5 text-[13px] font-bold text-white">
                            {i + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 p-2.5">
                        {single ? <span /> : <BannerPhotoMove id={img.id} isFirst={i === 0} isLast={i === photos.length - 1} />}
                        <ConfirmActionButton
                          label="Remove"
                          icon={<TrashIcon className="size-3.5" />}
                          title="Remove this photo?"
                          confirmLabel="Remove photo"
                          action={deleteBannerImage.bind(null, img.id)}
                        >
                          {single
                            ? "The homepage goes back to showing a package photo from this category."
                            : `It disappears from the ${slot.label.toLowerCase()} banner straight away.`}
                        </ConfirmActionButton>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              <BannerPhotoAdder banner={slot.key} room={slot.max - photos.length} />
            </section>
          );
        })}
      </div>
    </>
  );
}

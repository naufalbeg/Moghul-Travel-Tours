"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { BANNER_KEYS } from "@/lib/banners";
import { IMAGE_PATH_PATTERN, createSignedImageUploads, removeImages } from "@/lib/image-uploads";
import { prisma } from "@/lib/prisma";
import { IMAGE_BUCKETS, MAX_BANNER_IMAGES, publicImageUrl } from "@/lib/storage-config";

// BannerController. Same upload pattern as the gallery: signed URLs, the
// browser uploads the cropped photo straight to Storage, then
// saveBannerImage records it. Every change is saved immediately.

const BUCKET = IMAGE_BUCKETS.banners;

const EXPIRED = { ok: false as const, message: "Your session has expired. Please sign in again." };
const UNKNOWN_BANNER = { ok: false as const, message: "Unknown banner." };

const bannerKey = z.string().refine((key) => BANNER_KEYS.includes(key));

export async function createBannerImageUploads(banner: string, files: { type: string; size: number }[]) {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return EXPIRED;
  if (!bannerKey.safeParse(banner).success) return UNKNOWN_BANNER;

  const room = MAX_BANNER_IMAGES - (await prisma.bannerImage.count({ where: { banner } }));
  if (room <= 0) return { ok: false as const, message: `This banner already has ${MAX_BANNER_IMAGES} photos.` };
  return createSignedImageUploads(BUCKET, files, room);
}

/** Records an uploaded photo at the end of the banner's slideshow. */
export async function saveBannerImage(banner: string, path: string) {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return EXPIRED;
  if (!bannerKey.safeParse(banner).success) return UNKNOWN_BANNER;
  if (!IMAGE_PATH_PATTERN.test(path)) {
    return { ok: false as const, message: "That photo couldn't be saved. Please try uploading it again." };
  }

  const existing = await prisma.bannerImage.findMany({ where: { banner }, select: { sortOrder: true } });
  if (existing.length >= MAX_BANNER_IMAGES) {
    await removeImages(BUCKET, [path]);
    return { ok: false as const, message: `This banner already has ${MAX_BANNER_IMAGES} photos.` };
  }

  const image = await prisma.bannerImage.create({
    data: {
      banner,
      storagePath: path,
      url: publicImageUrl(BUCKET, path),
      sortOrder: Math.max(-1, ...existing.map((e) => e.sortOrder)) + 1,
    },
  });
  await logAudit({ userId: auth.admin.id, action: "ADD_BANNER_IMAGE", target: `banner_images:${image.id}`, detail: { banner } });
  revalidatePath("/admin/banners");
  return { ok: true as const };
}

/** Removes a photo from its banner and deletes the file. */
export async function deleteBannerImage(id: string) {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return EXPIRED;
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Unknown photo." };

  const image = await prisma.bannerImage.findUnique({ where: { id }, select: { storagePath: true, banner: true } });
  if (!image) return { ok: false, message: "This photo was already removed." };

  await prisma.bannerImage.delete({ where: { id } });
  await removeImages(BUCKET, [image.storagePath]);
  await logAudit({ userId: auth.admin.id, action: "DELETE_BANNER_IMAGE", target: `banner_images:${id}`, detail: { banner: image.banner } });
  revalidatePath("/admin/banners");
  return { ok: true };
}

/** Moves a photo one place earlier or later in its slideshow. */
export async function moveBannerImage(id: string, direction: "earlier" | "later") {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return EXPIRED;
  if (!z.uuid().safeParse(id).success || !["earlier", "later"].includes(direction)) {
    return { ok: false, message: "Unknown photo." };
  }

  const image = await prisma.bannerImage.findUnique({ where: { id }, select: { banner: true } });
  if (!image) return { ok: false, message: "This photo was removed." };

  const order = (
    await prisma.bannerImage.findMany({
      where: { banner: image.banner },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    })
  ).map((row) => row.id);
  const from = order.indexOf(id);
  const to = from + (direction === "earlier" ? -1 : 1);
  if (to < 0 || to >= order.length) return { ok: true };
  [order[from], order[to]] = [order[to], order[from]];

  // Renumber the whole banner so the order stays tidy (0, 1, 2…).
  await prisma.$transaction(
    order.map((rowId, i) => prisma.bannerImage.update({ where: { id: rowId }, data: { sortOrder: i } })),
  );
  await logAudit({ userId: auth.admin.id, action: "REORDER_BANNER_IMAGES", target: `banner_images:${id}`, detail: { banner: image.banner } });
  revalidatePath("/admin/banners");
  return { ok: true };
}

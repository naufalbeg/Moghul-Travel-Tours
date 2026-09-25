"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { IMAGE_PATH_PATTERN, createSignedImageUploads, removeImages } from "@/lib/image-uploads";
import { prisma } from "@/lib/prisma";
import { IMAGE_BUCKETS, MAX_GALLERY_BATCH, publicImageUrl } from "@/lib/storage-config";

// GalleryController (SDD 4.2.4). Upload is two steps: signed URLs, then the
// browser uploads straight to Storage, then saveGalleryImages records them.

const BUCKET = IMAGE_BUCKETS.gallery;

const EXPIRED = { ok: false as const, message: "Your session has expired. Please sign in again." };

const tagSchema = z
  .string()
  .trim()
  .min(1, "Enter a destination or trip name for these photos.")
  .max(60, "Keep the label under 60 characters.");

export async function createGalleryImageUploads(files: { type: string; size: number }[]) {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return EXPIRED;
  return createSignedImageUploads(BUCKET, files, MAX_GALLERY_BATCH);
}

/** createImage — REQ-MTT-004-002/003: record uploaded photos with their tag. */
export async function saveGalleryImages(tag: string, paths: string[]) {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return EXPIRED;

  const parsedTag = tagSchema.safeParse(tag);
  if (!parsedTag.success) return { ok: false as const, message: parsedTag.error.issues[0].message };
  if (paths.length === 0 || paths.length > MAX_GALLERY_BATCH || !paths.every((p) => IMAGE_PATH_PATTERN.test(p))) {
    return { ok: false as const, message: "Those photos couldn't be saved. Please try uploading again." };
  }

  await prisma.galleryImage.createMany({
    data: paths.map((path) => ({
      storagePath: path,
      url: publicImageUrl(BUCKET, path),
      tag: parsedTag.data,
      uploadedById: auth.admin.id,
    })),
  });
  await logAudit({
    userId: auth.admin.id,
    action: "UPLOAD_GALLERY_IMAGES",
    target: "gallery_images",
    detail: { tag: parsedTag.data, count: paths.length },
  });
  revalidatePath("/admin/gallery");
  return { ok: true as const, count: paths.length };
}

/** deleteImage — REQ-MTT-004-007: removes the file and the record. */
export async function deleteGalleryImage(id: string) {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return EXPIRED;
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Unknown photo." };

  const image = await prisma.galleryImage.findUnique({ where: { id }, select: { storagePath: true, tag: true } });
  if (!image) return { ok: false, message: "This photo was already deleted." };

  await prisma.galleryImage.delete({ where: { id } });
  await removeImages(BUCKET, [image.storagePath]);
  await logAudit({ userId: auth.admin.id, action: "DELETE_GALLERY_IMAGE", target: `gallery_images:${id}`, detail: { tag: image.tag } });
  revalidatePath("/admin/gallery");
  return { ok: true };
}

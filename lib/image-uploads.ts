import "server-only";
import { randomUUID } from "node:crypto";
import {
  IMAGE_EXTENSION,
  IMAGE_MAX_BYTES,
  isAllowedImageType,
  publicImageUrl,
  type ImageBucket,
} from "@/lib/storage-config";
import { createAdminClient } from "@/lib/supabase/admin";

export type SignedUpload = { path: string; token: string; url: string };

/**
 * Validates the files and issues one-time signed upload URLs, so the browser
 * can upload straight to Storage. Callers MUST run their RBAC check first.
 */
export async function createSignedImageUploads(
  bucket: ImageBucket,
  files: { type: string; size: number }[],
  maxFiles: number,
): Promise<{ ok: true; uploads: SignedUpload[] } | { ok: false; message: string }> {
  if (files.length === 0 || files.length > maxFiles) {
    return { ok: false, message: `Choose between 1 and ${maxFiles} images.` };
  }
  for (const file of files) {
    if (!isAllowedImageType(file.type)) return { ok: false, message: "Only JPG, PNG or WEBP images can be uploaded." };
    if (file.size > IMAGE_MAX_BYTES) return { ok: false, message: "Each image must be 5MB or smaller." };
  }

  const storage = createAdminClient().storage.from(bucket);
  const uploads: SignedUpload[] = [];
  for (const file of files) {
    const path = `${randomUUID()}.${IMAGE_EXTENSION[file.type as keyof typeof IMAGE_EXTENSION]}`;
    const { data, error } = await storage.createSignedUploadUrl(path);
    if (error) {
      console.error("createSignedUploadUrl failed", error);
      return { ok: false, message: "Couldn't prepare the upload. Please try again." };
    }
    uploads.push({ path: data.path, token: data.token, url: publicImageUrl(bucket, data.path) });
  }
  return { ok: true, uploads };
}

/** Deletes objects from a bucket, logging (not throwing) on failure. */
export async function removeImages(bucket: ImageBucket, paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await createAdminClient().storage.from(bucket).remove(paths);
  if (error) console.error(`Failed to delete images from ${bucket}`, error);
}

/** Object paths we issue: "<uuid>.<ext>". */
export const IMAGE_PATH_PATTERN = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

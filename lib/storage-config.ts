// Shared by the browser (file checks), server actions and scripts — so no
// server-only imports here.

export const IMAGE_BUCKETS = {
  packages: "package-images",
  gallery: "gallery-images",
} as const;

export type ImageBucket = (typeof IMAGE_BUCKETS)[keyof typeof IMAGE_BUCKETS];

/** SRS: JPG, PNG or WEBP, max 5MB each; up to 10 images per package. */
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const MAX_PACKAGE_IMAGES = 10;

export const IMAGE_EXTENSION: Record<(typeof IMAGE_MIME_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isAllowedImageType(type: string): type is (typeof IMAGE_MIME_TYPES)[number] {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(type);
}

/** Public URL for an object in a public bucket. */
export function publicImageUrl(bucket: ImageBucket, path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

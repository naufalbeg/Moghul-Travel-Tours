// Shared by the browser (file checks), server actions and scripts — so no
// server-only imports here.

export const IMAGE_BUCKETS = {
  packages: "package-images",
  gallery: "gallery-images",
  banners: "banner-images",
} as const;

export type ImageBucket = (typeof IMAGE_BUCKETS)[keyof typeof IMAGE_BUCKETS];

/** SRS: JPG, PNG or WEBP, max 5MB each; up to 10 images per package. */
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const MAX_PACKAGE_IMAGES = 10;

/**
 * Package photos are shown at 16:9 everywhere (Tailwind `aspect-video`), and
 * admins crop every photo to exactly that before it is uploaded.
 */
export const PACKAGE_IMAGE_ASPECT = 16 / 9;
/** Crops are saved as JPEG at most this wide (1920×1080), well under 5MB. */
export const CROPPED_IMAGE_MAX_WIDTH = 1920;
/**
 * Originals can be bigger than the 5MB storage limit (phone photos often
 * are) because only the smaller cropped copy is uploaded.
 */
export const ORIGINAL_IMAGE_MAX_BYTES = 25 * 1024 * 1024;

/**
 * Banner slideshow photos (homepage and package listing banners) are cropped
 * to a wide 3:1 strip and saved up to 2400×800; the banner shows them with
 * object-cover, so phones see the middle of the strip.
 */
export const BANNER_IMAGE_ASPECT = 3;
export const BANNER_IMAGE_MAX_WIDTH = 2400;
export const MAX_BANNER_IMAGES = 5;
/** Photos per gallery upload batch. */
export const MAX_GALLERY_BATCH = 20;

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

/**
 * Creates (or updates) the Supabase Storage buckets. Safe to re-run.
 *
 *   npm run setup-storage
 *
 * Buckets are public-read (photos are shown on the public site). Nobody can
 * upload with the public key: uploads only happen through signed upload URLs
 * that server actions issue after an admin/RBAC check. The bucket itself also
 * enforces the SRS limits: JPG/PNG/WEBP only, max 5MB per file.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { IMAGE_BUCKETS, IMAGE_MAX_BYTES, IMAGE_MIME_TYPES } from "../lib/storage-config";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const options = {
  public: true,
  fileSizeLimit: IMAGE_MAX_BYTES,
  allowedMimeTypes: [...IMAGE_MIME_TYPES],
};

for (const bucket of Object.values(IMAGE_BUCKETS)) {
  const { data: existing } = await supabase.storage.getBucket(bucket);
  const { error } = existing
    ? await supabase.storage.updateBucket(bucket, options)
    : await supabase.storage.createBucket(bucket, options);
  if (error) {
    console.error(`Bucket ${bucket}:`, error.message);
    process.exitCode = 1;
  } else {
    console.log(`Bucket ${bucket}: ${existing ? "updated" : "created"}`);
  }
}

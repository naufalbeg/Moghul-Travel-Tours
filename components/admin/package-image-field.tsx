"use client";

/* eslint-disable @next/next/no-img-element -- previews use blob: URLs, which next/image can't load */

import { useState, type DragEvent } from "react";
import { createPackageImageUploads } from "@/app/admin/(portal)/packages/actions";
import { ImageCropDialog, type CropJob } from "@/components/admin/image-crop-dialog";
import { AlertCircleIcon, CloseIcon, UploadIcon } from "@/components/ui/icons";
import {
  CROPPED_IMAGE_MAX_WIDTH,
  MAX_PACKAGE_IMAGES,
  ORIGINAL_IMAGE_MAX_BYTES,
  PACKAGE_IMAGE_ASPECT,
  isAllowedImageType,
} from "@/lib/storage-config";
import { createClient } from "@/lib/supabase/client";
import { PACKAGE_BUCKET } from "@/lib/validation/package";

export type ImageItem = {
  key: string;
  /** Null until a new photo finishes uploading, or if its upload failed. */
  storagePath: string | null;
  url: string;
  isPrimary: boolean;
  status: "uploading" | "done" | "failed";
};

type Props = {
  images: ImageItem[];
  onChange: (update: (images: ImageItem[]) => ImageItem[]) => void;
  error?: string;
};

/**
 * Photo picker for a package. Every photo goes through the 16:9 crop dialog
 * first; the cropped JPEG then uploads straight to Supabase Storage via a
 * signed URL from createPackageImageUploads, and only its path is saved with
 * the package.
 */
export function PackageImageField({ images, onChange, error }: Props) {
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // Photos waiting to be cropped, and how many were in this batch (for "2 of 5").
  const [queue, setQueue] = useState<CropJob[]>([]);
  const [batchSize, setBatchSize] = useState(0);

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setNotice(null);

    const room = MAX_PACKAGE_IMAGES - images.length - queue.length;
    const problems: string[] = [];
    const accepted = Array.from(fileList).filter((file) => {
      if (!isAllowedImageType(file.type)) {
        problems.push(`${file.name} isn't a JPG, PNG or WEBP image.`);
        return false;
      }
      if (file.size > ORIGINAL_IMAGE_MAX_BYTES) {
        problems.push(`${file.name} is larger than 25MB.`);
        return false;
      }
      return true;
    });
    if (accepted.length > room) {
      problems.push(`Only ${MAX_PACKAGE_IMAGES} images are allowed — ${accepted.length - room} were skipped.`);
      accepted.length = Math.max(0, room);
    }
    if (problems.length) setNotice(problems.join(" "));
    if (accepted.length === 0) return;

    const jobs = accepted.map((file) => ({ id: crypto.randomUUID(), src: URL.createObjectURL(file) }));
    setBatchSize((n) => (queue.length ? n : 0) + jobs.length);
    setQueue((q) => [...q, ...jobs]);
  }

  function adjust(img: ImageItem) {
    setNotice(null);
    setBatchSize(1);
    setQueue([{ id: crypto.randomUUID(), src: img.url, targetKey: img.key }]);
  }

  function finishJob(job: CropJob) {
    // New files' previews are only needed while cropping; saved photos' URLs aren't ours to revoke.
    if (!job.targetKey) URL.revokeObjectURL(job.src);
    setQueue((q) => q.filter((j) => j.id !== job.id));
  }

  function cancelCropping() {
    for (const job of queue) if (!job.targetKey) URL.revokeObjectURL(job.src);
    setQueue([]);
  }

  function onCropped(job: CropJob, file: File) {
    finishJob(job);
    if (job.targetKey) replacePhoto(job.targetKey, file);
    else addPhoto(file);
  }

  async function addPhoto(file: File) {
    const key = crypto.randomUUID();
    onChange((current) =>
      withPrimary([
        ...current,
        { key, storagePath: null, url: URL.createObjectURL(file), isPrimary: false, status: "uploading" },
      ]),
    );
    const result = await upload(file);
    if (!result.ok) setNotice(result.message);
    onChange((current) =>
      current.map((img) =>
        img.key === key
          ? result.ok
            ? { ...img, storagePath: result.path, status: "done" }
            : { ...img, status: "failed" }
          : img,
      ),
    );
  }

  /** Swaps in a re-cropped copy; the old photo stays until the new one is stored. */
  async function replacePhoto(key: string, file: File) {
    const previous = images.find((img) => img.key === key);
    if (!previous) return;
    onChange((current) =>
      current.map((img) => (img.key === key ? { ...img, url: URL.createObjectURL(file), status: "uploading" } : img)),
    );
    const result = await upload(file);
    if (!result.ok) setNotice(`The new crop wasn't saved: ${result.message}`);
    onChange((current) =>
      current.map((img) =>
        img.key === key
          ? result.ok
            ? { ...img, storagePath: result.path, status: "done" }
            : { ...img, url: previous.url, status: previous.status }
          : img,
      ),
    );
  }

  function remove(key: string) {
    onChange((current) => withPrimary(current.filter((img) => img.key !== key)));
  }

  function makePrimary(key: string) {
    onChange((current) => current.map((img) => ({ ...img, isPrimary: img.key === key })));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  const invalid = Boolean(error);

  return (
    <div>
      <label
        htmlFor="package-images"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mb-4 flex cursor-pointer flex-col items-center rounded-[10px] border-[1.5px] border-dashed px-6 py-8 text-center ${
          invalid ? "border-danger bg-danger-pale" : dragging ? "border-primary bg-primary-pale" : "border-line hover:border-primary"
        }`}
      >
        <UploadIcon className={`mb-2.5 size-8 ${invalid ? "text-danger" : "text-primary"}`} />
        <span className={`mb-1 text-[15px] font-semibold ${invalid ? "text-danger" : ""}`}>
          Drag photos here, or click to browse
        </span>
        <span className="text-[13px] text-muted">
          JPG, PNG, or WEBP — up to {MAX_PACKAGE_IMAGES} photos. You&apos;ll crop each one to fit the website.
        </span>
        <span className="mt-1 text-[13px] text-muted">
          <strong className="font-semibold text-ink">Best results:</strong> landscape (sideways) photos at least{" "}
          {CROPPED_IMAGE_MAX_WIDTH} × {Math.round(CROPPED_IMAGE_MAX_WIDTH / PACKAGE_IMAGE_ASPECT)} pixels. Most phone
          and camera photos are bigger — that&apos;s fine. Photos saved from WhatsApp are often too small and can look
          blurry.
        </span>
        <input
          id="package-images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {(error || notice) && (
        <p className="mb-4 flex items-start gap-1.5 text-[13.5px] font-semibold text-danger">
          <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
          {error ?? notice}
        </p>
      )}

      {images.length > 0 && (
        <>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {images.map((img) => (
              <li key={img.key} className="overflow-hidden rounded-lg border border-line bg-white">
                <div className="relative aspect-video bg-primary-pale">
                  <img
                    src={img.url}
                    alt=""
                    className={`size-full object-cover ${img.status === "uploading" ? "opacity-50" : ""}`}
                  />
                  {img.status === "uploading" && (
                    <span className="absolute inset-x-0 bottom-0 bg-navy/75 py-1 text-center text-[12px] font-semibold text-white">
                      Uploading…
                    </span>
                  )}
                  {img.status === "failed" && (
                    <span className="absolute inset-x-0 bottom-0 bg-danger py-1 text-center text-[12px] font-semibold text-white">
                      Upload failed
                    </span>
                  )}
                  {img.isPrimary && (
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">
                      Main photo
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(img.key)}
                    aria-label="Remove photo"
                    className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-navy/70 text-white hover:bg-navy"
                  >
                    <CloseIcon className="size-3.5" />
                  </button>
                </div>
                {img.status === "done" && (
                  <div className="flex flex-wrap gap-x-4 px-3 py-1.5 text-[13px] font-semibold text-primary">
                    <button type="button" onClick={() => adjust(img)} className="min-h-9 hover:underline">
                      Adjust crop
                    </button>
                    {!img.isPrimary && (
                      <button type="button" onClick={() => makePrimary(img.key)} className="min-h-9 hover:underline">
                        Set as main
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-muted">
            The main photo is shown on package cards. Removing a photo here deletes it when you save.
          </p>
        </>
      )}

      <ImageCropDialog
        job={queue[0] ?? null}
        position={{ index: batchSize - queue.length, total: batchSize }}
        onCropped={onCropped}
        onSkip={finishJob}
        onCancel={cancelCropping}
      />
    </div>
  );
}

async function upload(file: File): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  const prepared = await createPackageImageUploads([{ type: file.type, size: file.size }]);
  if (!prepared.ok) return { ok: false, message: prepared.message };
  const target = prepared.uploads[0];
  const { error } = await createClient()
    .storage.from(PACKAGE_BUCKET)
    .uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });
  if (error) {
    console.error("Upload failed", error);
    return { ok: false, message: "A photo didn't upload. Please try again." };
  }
  return { ok: true, path: target.path };
}

function withPrimary(images: ImageItem[]) {
  if (images.length === 0 || images.some((img) => img.isPrimary)) return images;
  return images.map((img, i) => ({ ...img, isPrimary: i === 0 }));
}

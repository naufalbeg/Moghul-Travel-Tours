"use client";

import { useState, useTransition } from "react";
import { createBannerImageUploads, moveBannerImage, saveBannerImage } from "@/app/admin/(portal)/banners/actions";
import { ImageCropDialog, type CropJob, type CropShape } from "@/components/admin/image-crop-dialog";
import { AlertCircleIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@/components/ui/icons";
import { bannerSlot } from "@/lib/banners";
import { IMAGE_BUCKETS, ORIGINAL_IMAGE_MAX_BYTES, isAllowedImageType } from "@/lib/storage-config";
import { createClient } from "@/lib/supabase/client";

const CROP_HINT = {
  strip:
    "Drag the photo and zoom with the slider. Keep the main subject near the middle: computers show the whole strip, phones show the centre.",
  door: "Drag the photo and zoom with the slider. The whole frame is shown on the homepage, above the category's name.",
};

/**
 * "Add photos" for one slot: each chosen photo is cropped to the slot's shape
 * (a 3:1 strip for the listing banners, 3:2 for the homepage panels),
 * uploaded straight to Storage, then recorded with saveBannerImage (which
 * refreshes the page).
 */
export function BannerPhotoAdder({ banner, room }: { banner: string; room: number }) {
  const [queue, setQueue] = useState<CropJob[]>([]);
  const [batchSize, setBatchSize] = useState(0);
  const [uploading, setUploading] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const inputId = `banner-photos-${banner}`;
  const slot = bannerSlot(banner)!;
  const shape: CropShape = { aspect: slot.aspect, maxWidth: slot.maxWidth, hint: CROP_HINT[slot.kind] };

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setNotice(null);
    const problems: string[] = [];
    const accepted = Array.from(fileList).filter((file) => {
      if (!isAllowedImageType(file.type)) problems.push(`${file.name} isn't a JPG, PNG or WEBP image.`);
      else if (file.size > ORIGINAL_IMAGE_MAX_BYTES) problems.push(`${file.name} is larger than 25MB.`);
      else return true;
      return false;
    });
    const space = room - uploading;
    if (accepted.length > space) {
      const skipped = accepted.length - space;
      problems.push(
        slot.max === 1
          ? `This slot holds one photo — ${skipped} ${skipped === 1 ? "was" : "were"} skipped.`
          : `A banner holds up to ${slot.max} photos — ${skipped} ${skipped === 1 ? "was" : "were"} skipped.`,
      );
      accepted.length = Math.max(0, space);
    }
    if (problems.length) setNotice(problems.join(" "));
    if (accepted.length === 0) return;
    setBatchSize(accepted.length);
    setQueue(accepted.map((file) => ({ id: crypto.randomUUID(), src: URL.createObjectURL(file) })));
  }

  function finishJob(job: CropJob) {
    URL.revokeObjectURL(job.src);
    setQueue((q) => q.filter((j) => j.id !== job.id));
  }

  function cancel() {
    for (const job of queue) URL.revokeObjectURL(job.src);
    setQueue([]);
  }

  async function onCropped(job: CropJob, file: File) {
    finishJob(job);
    setUploading((n) => n + 1);
    try {
      const prepared = await createBannerImageUploads(banner, [{ type: file.type, size: file.size }]);
      if (!prepared.ok) return setNotice(prepared.message);
      const target = prepared.uploads[0];
      const { error } = await createClient()
        .storage.from(IMAGE_BUCKETS.banners)
        .uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });
      if (error) {
        console.error("Banner upload failed", error);
        return setNotice("A photo didn't upload. Please try again.");
      }
      const saved = await saveBannerImage(banner, target.path);
      if (!saved.ok) setNotice(saved.message);
    } finally {
      setUploading((n) => n - 1);
    }
  }

  const full = room - uploading <= 0;

  return (
    <div>
      <label
        htmlFor={inputId}
        aria-disabled={full}
        className={`inline-flex min-h-11 items-center gap-2 rounded-lg border-[1.5px] px-4 text-fine font-bold ${
          full
            ? "cursor-not-allowed border-line text-muted"
            : "cursor-pointer border-field bg-white text-primary-dark hover:bg-canvas has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-primary-dark"
        }`}
      >
        <PlusIcon className="size-4" />
        {uploading > 0
          ? `Uploading ${uploading}…`
          : full
            ? slot.max === 1
              ? "Remove the photo to choose another"
              : `Banner is full (${slot.max} photos)`
            : slot.max === 1
              ? "Add photo"
              : "Add photos"}
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={slot.max > 1}
          disabled={full}
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {notice && (
        <p className="mt-2 flex items-start gap-1.5 text-sm font-semibold text-danger">
          <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
          {notice}
        </p>
      )}
      <ImageCropDialog
        job={queue[0] ?? null}
        position={{ index: batchSize - queue.length, total: batchSize }}
        shape={shape}
        onCropped={onCropped}
        onSkip={finishJob}
        onCancel={cancel}
      />
    </div>
  );
}

/** ← → buttons that move a photo one place in its slideshow. */
export function BannerPhotoMove({ id, isFirst, isLast }: { id: string; isFirst: boolean; isLast: boolean }) {
  const [pending, startTransition] = useTransition();
  const move = (direction: "earlier" | "later") =>
    startTransition(async () => {
      await moveBannerImage(id, direction);
    });
  const button =
    "flex size-9 items-center justify-center rounded-lg border border-field bg-white text-primary-dark hover:border-primary disabled:opacity-35";
  return (
    <div className="flex gap-1.5">
      <button type="button" onClick={() => move("earlier")} disabled={isFirst || pending} aria-label="Show earlier" className={button}>
        <ChevronLeftIcon className="size-4" />
      </button>
      <button type="button" onClick={() => move("later")} disabled={isLast || pending} aria-label="Show later" className={button}>
        <ChevronRightIcon className="size-4" />
      </button>
    </div>
  );
}

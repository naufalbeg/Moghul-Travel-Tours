"use client";

/* eslint-disable @next/next/no-img-element -- previews use blob: URLs, which next/image can't load */

import { useRef, useState, type DragEvent } from "react";
import { createPackageImageUploads } from "@/app/admin/(portal)/packages/actions";
import { AlertCircleIcon, CloseIcon, UploadIcon } from "@/components/ui/icons";
import {
  IMAGE_MAX_BYTES,
  MAX_PACKAGE_IMAGES,
  isAllowedImageType,
} from "@/lib/storage-config";
import { createClient } from "@/lib/supabase/client";
import { PACKAGE_BUCKET } from "@/lib/validation/package";

export type ImageItem = {
  key: string;
  /** Null while uploading or if the upload failed. */
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
 * Photo picker for a package. Files upload straight to Supabase Storage via
 * signed URLs from createPackageImageUploads; only the paths are saved with
 * the package.
 */
export function PackageImageField({ images, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setNotice(null);

    const room = MAX_PACKAGE_IMAGES - images.length;
    const files = Array.from(fileList);
    const problems: string[] = [];
    const accepted = files.filter((file) => {
      if (!isAllowedImageType(file.type)) {
        problems.push(`${file.name} isn't a JPG, PNG or WEBP image.`);
        return false;
      }
      if (file.size > IMAGE_MAX_BYTES) {
        problems.push(`${file.name} is larger than 5MB.`);
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

    const pending: ImageItem[] = accepted.map((file) => ({
      key: crypto.randomUUID(),
      storagePath: null,
      url: URL.createObjectURL(file),
      isPrimary: false,
      status: "uploading",
    }));
    onChange((current) => withPrimary([...current, ...pending]));

    const markFailed = (keys: string[]) =>
      onChange((current) => current.map((img) => (keys.includes(img.key) ? { ...img, status: "failed" } : img)));

    const prepared = await createPackageImageUploads(accepted.map((f) => ({ type: f.type, size: f.size })));
    if (!prepared.ok) {
      setNotice(prepared.message);
      markFailed(pending.map((p) => p.key));
      return;
    }

    const storage = createClient().storage.from(PACKAGE_BUCKET);
    await Promise.all(
      accepted.map(async (file, i) => {
        const target = prepared.uploads[i];
        const { error: uploadError } = await storage.uploadToSignedUrl(target.path, target.token, file, {
          contentType: file.type,
        });
        const key = pending[i].key;
        if (uploadError) {
          console.error("Upload failed", uploadError);
          markFailed([key]);
          return;
        }
        // Keep showing the local preview; the saved record uses the public URL.
        onChange((current) =>
          current.map((img) => (img.key === key ? { ...img, storagePath: target.path, status: "done" } : img)),
        );
      }),
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
          JPG, PNG, or WEBP — up to 5MB each, up to {MAX_PACKAGE_IMAGES} images
        </span>
        <input
          ref={inputRef}
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
          <ul className="flex flex-wrap gap-3">
            {images.map((img) => (
              <li key={img.key} className="relative size-[110px] overflow-hidden rounded-lg bg-primary-pale">
                <img src={img.url} alt="" className={`size-full object-cover ${img.status === "uploading" ? "opacity-50" : ""}`} />
                {img.status === "uploading" && (
                  <span className="absolute inset-x-0 bottom-0 bg-navy/75 py-1 text-center text-[11px] font-semibold text-white">
                    Uploading…
                  </span>
                )}
                {img.status === "failed" && (
                  <span className="absolute inset-x-0 bottom-0 bg-danger py-1 text-center text-[11px] font-semibold text-white">
                    Upload failed
                  </span>
                )}
                {img.isPrimary ? (
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                    Main photo
                  </span>
                ) : (
                  img.status === "done" && (
                    <button
                      type="button"
                      onClick={() => makePrimary(img.key)}
                      className="absolute bottom-1.5 left-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-primary-dark hover:bg-white"
                    >
                      Set as main
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => remove(img.key)}
                  aria-label="Remove photo"
                  className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-navy/70 text-white hover:bg-navy"
                >
                  <CloseIcon className="size-3" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-muted">
            The main photo is shown on package cards. Removing a photo here deletes it when you save.
          </p>
        </>
      )}
    </div>
  );
}

function withPrimary(images: ImageItem[]) {
  if (images.length === 0 || images.some((img) => img.isPrimary)) return images;
  return images.map((img, i) => ({ ...img, isPrimary: i === 0 }));
}

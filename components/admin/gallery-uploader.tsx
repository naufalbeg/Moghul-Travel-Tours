"use client";

import { useRouter } from "next/navigation";
import { useState, type DragEvent } from "react";
import { createGalleryImageUploads, saveGalleryImages } from "@/app/admin/(portal)/gallery/actions";
import { Field, describedBy, fieldClass } from "@/components/admin/field";
import { Alert } from "@/components/ui/alert";
import { UploadIcon } from "@/components/ui/icons";
import { IMAGE_BUCKETS, IMAGE_MAX_BYTES, MAX_GALLERY_BATCH, isAllowedImageType } from "@/lib/storage-config";
import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "working"; text: string }
  | { kind: "done"; text: string }
  | { kind: "error"; text: string };

/** Upload form for AdminGalleryPanel [PKG-MTT-004-002] — REQ-MTT-004-001/002. */
export function GalleryUploader({ existingTags }: { existingTags: string[] }) {
  const router = useRouter();
  const [tag, setTag] = useState("");
  const [tagError, setTagError] = useState<string | undefined>();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const busy = status.kind === "working";

  async function upload(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0 || busy) return;

    if (!tag.trim()) {
      setTagError("Enter a destination or trip name first, e.g. “Umrah March 2026”.");
      return;
    }
    setTagError(undefined);

    const bad = files.filter((f) => !isAllowedImageType(f.type) || f.size > IMAGE_MAX_BYTES);
    if (bad.length) {
      setStatus({
        kind: "error",
        text: `${bad.map((f) => f.name).join(", ")} ${bad.length === 1 ? "isn't" : "aren't"} a JPG, PNG or WEBP under 5MB. Nothing was uploaded.`,
      });
      return;
    }
    if (files.length > MAX_GALLERY_BATCH) {
      setStatus({ kind: "error", text: `Please upload up to ${MAX_GALLERY_BATCH} photos at a time.` });
      return;
    }

    setStatus({ kind: "working", text: "Preparing upload…" });
    const prepared = await createGalleryImageUploads(files.map((f) => ({ type: f.type, size: f.size })));
    if (!prepared.ok) {
      setStatus({ kind: "error", text: prepared.message });
      return;
    }

    const storage = createClient().storage.from(IMAGE_BUCKETS.gallery);
    let done = 0;
    const uploaded: string[] = [];
    await Promise.all(
      files.map(async (file, i) => {
        const target = prepared.uploads[i];
        const { error } = await storage.uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });
        if (error) console.error("Upload failed", file.name, error);
        else uploaded.push(target.path);
        done++;
        setStatus({ kind: "working", text: `Uploading ${done} of ${files.length}…` });
      }),
    );

    if (uploaded.length === 0) {
      setStatus({ kind: "error", text: "The upload failed. Please check your connection and try again." });
      return;
    }
    const saved = await saveGalleryImages(tag, uploaded);
    if (!saved.ok) {
      setStatus({ kind: "error", text: saved.message });
      return;
    }
    const failed = files.length - uploaded.length;
    setStatus({
      kind: failed ? "error" : "done",
      text: `Added ${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} to “${tag.trim()}”.${
        failed ? ` ${failed} failed to upload — please try those again.` : " They're now on the Gallery page."
      }`,
    });
    router.refresh();
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files);
  }

  return (
    <section className="mb-8 rounded-xl border border-line bg-white px-5 py-6 sm:px-8">
      <h3 className="mb-1 text-[17px]">Upload photos</h3>
      <p className="mb-5 text-sm text-muted">Label them first, then choose the photos. Visitors can filter the gallery by label.</p>

      {status.kind !== "idle" && status.kind !== "working" && (
        <div className="mb-5">
          <Alert tone={status.kind === "done" ? "success" : "error"} title={status.text} />
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Field
          id="gallery-tag"
          label="Destination or trip"
          hint={existingTags.length ? "Pick an existing label or type a new one." : "e.g. Umrah March 2026, Turkiye, Langkawi"}
          error={tagError}
        >
          <input
            id="gallery-tag"
            list="gallery-tags"
            value={tag}
            onChange={(e) => {
              setTag(e.target.value);
              if (tagError) setTagError(undefined);
            }}
            placeholder="e.g. Umrah March 2026"
            maxLength={60}
            aria-invalid={Boolean(tagError)}
            aria-describedby={describedBy("gallery-tag", "hint", tagError)}
            className={fieldClass(tagError)}
          />
          <datalist id="gallery-tags">
            {existingTags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>

        <label
          htmlFor="gallery-files"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-[10px] border-[1.5px] border-dashed px-6 py-6 text-center ${
            dragging ? "border-primary bg-primary-pale" : "border-line hover:border-primary"
          } ${busy ? "pointer-events-none opacity-70" : ""}`}
        >
          <UploadIcon className="mb-2 size-8 text-primary" />
          <span className="mb-1 text-[15px] font-semibold">{busy && status.kind === "working" ? status.text : "Drag photos here, or click to browse"}</span>
          <span className="text-[13px] text-muted">JPG, PNG, or WEBP — up to 5MB each, {MAX_GALLERY_BATCH} at a time</span>
          <input
            id="gallery-files"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            className="sr-only"
            onChange={(e) => {
              upload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </section>
  );
}

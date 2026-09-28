"use client";

import { useEffect, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { cropImage } from "@/lib/crop-image";
import { CROPPED_IMAGE_MAX_WIDTH, PACKAGE_IMAGE_ASPECT } from "@/lib/storage-config";

export type CropJob = {
  id: string;
  /** blob: URL of a newly chosen file, or the public URL of a saved photo. */
  src: string;
  /** Set when re-cropping a photo already on the package (vs. a new upload). */
  targetKey?: string;
};

/** Crops under this width look soft on a large screen. */
const LOW_RES_WIDTH = 1000;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * Modal crop step for package photos: a fixed 16:9 frame the admin drags and
 * zooms, so every photo shows exactly what they chose on the public site.
 * Works through one job at a time; the parent keeps the queue.
 */
export function ImageCropDialog({
  job,
  position,
  onCropped,
  onSkip,
  onCancel,
}: {
  job: CropJob | null;
  position: { index: number; total: number };
  onCropped: (job: CropJob, file: File) => void;
  onSkip: (job: CropJob) => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (job && !dialog.open) dialog.showModal();
    if (!job && dialog.open) dialog.close();
  }, [job]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="crop-title"
      // Escape closes the dialog natively — treat it like Cancel.
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[880px] rounded-[14px] p-0 shadow-[0_24px_60px_rgba(13,44,78,0.35)] backdrop:bg-navy/70"
    >
      {job && (
        <CropStep
          key={job.id}
          job={job}
          position={position}
          onCropped={onCropped}
          onSkip={onSkip}
          onCancel={onCancel}
        />
      )}
    </dialog>
  );
}

function CropStep({
  job,
  position,
  onCropped,
  onSkip,
  onCancel,
}: {
  job: CropJob;
  position: { index: number; total: number };
  onCropped: (job: CropJob, file: File) => void;
  onSkip: (job: CropJob) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [area, setArea] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function confirm() {
    if (!area) return;
    setWorking(true);
    setProblem(null);
    try {
      onCropped(job, await cropImage(job.src, area, CROPPED_IMAGE_MAX_WIDTH));
    } catch (err) {
      console.error("Crop failed", err);
      setProblem("Couldn't crop this photo. Please try again, or choose a different photo.");
      setWorking(false);
    }
  }

  const zoomBy = (delta: number) => setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
  const isAdjust = Boolean(job.targetKey);
  const multiple = position.total > 1;

  return (
    <div>
      <div className="px-6 pt-6 pb-4">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="crop-title" className="text-xl text-primary-dark">
            {isAdjust ? "Adjust crop" : "Crop photo"}
          </h2>
          {multiple && (
            <span className="text-sm font-semibold text-muted">
              Photo {position.index + 1} of {position.total}
            </span>
          )}
        </div>
        <p className="text-[15px] text-muted">
          Drag the photo to choose what shows inside the frame, and zoom in with the slider. The website shows
          exactly this.
        </p>
      </div>

      <div className="relative h-[min(56vh,460px)] bg-navy">
        <Cropper
          image={job.src}
          crop={crop}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          aspect={PACKAGE_IMAGE_ASPECT}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
          mediaProps={{ crossOrigin: "anonymous" }}
        />
      </div>

      <div className="px-6 pt-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => zoomBy(-0.25)}
            aria-label="Zoom out"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-line text-xl font-bold text-primary-dark hover:border-primary"
          >
            −
          </button>
          <label htmlFor="crop-zoom" className="sr-only">
            Zoom
          </label>
          <input
            id="crop-zoom"
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-11 w-full accent-primary"
          />
          <button
            type="button"
            onClick={() => zoomBy(0.25)}
            aria-label="Zoom in"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-line text-xl font-bold text-primary-dark hover:border-primary"
          >
            +
          </button>
        </div>
        {area && area.width < LOW_RES_WIDTH && (
          <p className="mt-2 text-[13.5px] text-accent-dark">
            This part of the photo is quite small, so it may look blurry on large screens. Zooming out helps, or
            use a larger photo (at least {CROPPED_IMAGE_MAX_WIDTH} pixels wide is best).
          </p>
        )}
        {problem && <p className="mt-2 text-sm font-semibold text-danger">{problem}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 px-6 pt-5 pb-6">
        {!isAdjust && multiple && (
          <button
            type="button"
            onClick={() => onSkip(job)}
            disabled={working}
            className="mr-auto min-h-11 px-2 text-[14.5px] font-semibold text-muted hover:text-ink"
          >
            Skip this photo
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          disabled={working}
          className="min-h-11 rounded-lg border-[1.5px] border-line px-5 font-semibold"
        >
          {multiple && !isAdjust ? "Cancel all" : "Cancel"}
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={working || !area}
          className="min-h-11 rounded-lg bg-accent px-6 font-bold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {working ? "Cropping…" : multiple && position.index + 1 < position.total ? "Use this crop — next" : "Use this crop"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { deletePackage } from "@/app/admin/(portal)/packages/actions";
import { TrashIcon } from "@/components/ui/icons";

/** Delete with a confirmation dialog (SRS A3: confirm before deleting). */
export function DeletePackageButton({ id, title }: { id: string; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deletePackage(id);
      if (result.ok) dialogRef.current?.close();
      else setError(result.message ?? "Couldn't delete this package.");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="flex min-h-9 items-center gap-1.5 rounded-[7px] border border-[#f3d3ce] px-3 text-[13.5px] font-semibold text-danger hover:bg-danger-pale"
      >
        <TrashIcon className="size-3.5" />
        Delete
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`delete-${id}-title`}
        className="m-auto w-[calc(100%-2rem)] max-w-[440px] rounded-[14px] p-0 shadow-[0_24px_60px_rgba(13,44,78,0.35)] backdrop:bg-navy/55"
      >
        <div className="p-6">
          <h2 id={`delete-${id}-title`} className="mb-2 text-xl text-primary-dark">
            Delete this package?
          </h2>
          <p className="text-[15px] text-muted">
            <strong className="text-ink">{title}</strong> will be removed from the website straight away.
            It stays in the records, so it can be recovered if deleted by mistake.
          </p>
          {error && <p className="mt-3 text-sm font-semibold text-danger">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-11 rounded-lg border-[1.5px] border-line px-5 font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={pending}
            className="min-h-11 rounded-lg bg-danger px-5 font-bold text-white disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Delete package"}
          </button>
        </div>
      </dialog>
    </>
  );
}

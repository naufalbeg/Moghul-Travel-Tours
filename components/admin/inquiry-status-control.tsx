"use client";

import { useState, useTransition } from "react";
import { updateInquiryStatus } from "@/app/admin/(portal)/inquiries/actions";
import type { InquiryStatus } from "@/generated/prisma/enums";
import { INQUIRY_STATUS, INQUIRY_STATUS_ORDER } from "@/lib/inquiry-labels";

/** Status update control for the inquiry detail view (REQ-MTT-003-008). */
export function InquiryStatusControl({ id, status }: { id: string; status: InquiryStatus }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: InquiryStatus) {
    if (next === status) return;
    setError(null);
    startTransition(async () => {
      const result = await updateInquiryStatus(id, next);
      if (!result.ok) setError(result.message ?? "Couldn't update the status.");
    });
  }

  return (
    <div>
      <div role="radiogroup" aria-label="Inquiry status" className="flex flex-wrap gap-2">
        {INQUIRY_STATUS_ORDER.map((s) => {
          const active = s === status;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={pending}
              onClick={() => change(s)}
              className={`min-h-11 rounded-lg border-[1.5px] px-4 text-[14.5px] font-bold disabled:opacity-60 ${
                active ? "border-primary bg-primary text-white" : "border-line bg-white hover:border-primary"
              }`}
            >
              {INQUIRY_STATUS[s].label}
            </button>
          );
        })}
      </div>
      {pending && <p className="mt-2 text-sm text-muted">Saving…</p>}
      {error && <p className="mt-2 text-sm font-semibold text-danger">{error}</p>}
    </div>
  );
}

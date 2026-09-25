"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveAnnouncement } from "@/app/admin/(portal)/announcements/actions";
import { Field, describedBy, fieldClass, primaryButton } from "@/components/admin/field";
import { Alert } from "@/components/ui/alert";
import { MegaphoneIcon } from "@/components/ui/icons";
import {
  validateAnnouncement,
  type AnnouncementErrors,
  type AnnouncementInput,
} from "@/lib/validation/announcement";

const EMPTY: AnnouncementInput = { title: "", body: "", expiresOn: "" };

/** Add / edit announcement — AdminAnnouncementsPanel [PKG-MTT-007-002]. Pass initial = null for new. */
export function AnnouncementForm({ id, initial }: { id: string | null; initial: AnnouncementInput | null }) {
  const [values, setValues] = useState(initial ?? EMPTY);
  const [errors, setErrors] = useState<AnnouncementErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (key: keyof AnnouncementInput, value: string) => setValues((v) => ({ ...v, [key]: value }));

  function fail(found: AnnouncementErrors, message?: string) {
    const count = Object.keys(found).length;
    setErrors(found);
    setBanner(message ?? `Please fix ${count} error${count === 1 ? "" : "s"} before saving.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function save() {
    const check = validateAnnouncement(values);
    if (!check.ok) return fail(check.errors);
    startTransition(async () => {
      const result = await saveAnnouncement(id, values);
      fail(result.errors ?? {}, result.message); // success redirects instead
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      noValidate
      className="max-w-[680px]"
    >
      <h2 className="mb-6 text-[23px]">{id ? "Edit announcement" : "Post an announcement"}</h2>

      {banner && (
        <div className="mb-5">
          <Alert tone="error" title={banner} />
        </div>
      )}

      <div className="space-y-5 rounded-xl border border-line bg-white px-5 py-7 sm:px-8">
        <Field id="title" label="Headline" hint="Keep it short, e.g. “Early bird promo”." error={errors.title}>
          <input
            id="title"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={120}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describedBy("title", "hint", errors.title)}
            className={fieldClass(errors.title)}
          />
        </Field>
        <Field id="body" label="Announcement" hint="One or two sentences." error={errors.body}>
          <textarea
            id="body"
            rows={3}
            value={values.body}
            onChange={(e) => set("body", e.target.value)}
            maxLength={400}
            placeholder="e.g. 10% off 2027 Umrah packages. Limited seats."
            aria-invalid={Boolean(errors.body)}
            aria-describedby={describedBy("body", "hint", errors.body)}
            className={`${fieldClass(errors.body)} resize-y`}
          />
        </Field>
        <Field
          id="expiresOn"
          label="Show until"
          optional
          hint="It disappears from the website after this day. Leave blank to show it until you turn it off."
          error={errors.expiresOn}
        >
          <input
            id="expiresOn"
            type="date"
            value={values.expiresOn}
            onChange={(e) => set("expiresOn", e.target.value)}
            aria-describedby={describedBy("expiresOn", "hint", errors.expiresOn)}
            className={`${fieldClass(errors.expiresOn)} sm:max-w-xs`}
          />
        </Field>

        {(values.title || values.body) && (
          <div>
            <p className="mb-2 text-sm font-semibold">Preview</p>
            <div className="flex items-start justify-center gap-2.5 rounded-lg bg-accent px-4 py-2.5 text-center text-[15px] text-white">
              <MegaphoneIcon className="mt-0.5 size-[18px] shrink-0" />
              <p>
                <strong>{values.title || "Headline"}</strong> — <span className="font-medium">{values.body || "Announcement text"}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5">
        <Link href="/admin/announcements" className="flex min-h-11 items-center px-4 font-semibold text-muted hover:text-ink">
          Cancel
        </Link>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : id ? "Save changes" : "Publish announcement"}
        </button>
      </div>
    </form>
  );
}

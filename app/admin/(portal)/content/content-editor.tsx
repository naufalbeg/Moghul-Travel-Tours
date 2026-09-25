"use client";

import { useEffect, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { AlertCircleIcon, ExternalIcon } from "@/components/ui/icons";
import { OPTIONAL_CONTENT_KEYS, type SiteContent, type SiteContentKey } from "@/lib/site-content";
import { validateSiteContent, type ContentErrors } from "@/lib/validation/site-content";
import { updateSiteContent } from "./actions";

type Field = {
  key: SiteContentKey;
  label: string;
  hint?: string;
  kind?: "text" | "textarea" | "email" | "tel" | "url";
  rows?: number;
  placeholder?: string;
};

const SECTIONS: { title: string; hint: string; preview?: string; fields: Field[] }[] = [
  {
    title: "About us",
    hint: "The company story on the About page, and the short summary on the homepage.",
    preview: "/about",
    fields: [
      { key: "about_summary", label: "Short summary", kind: "textarea", rows: 3, hint: "One or two sentences. Shown on the homepage and at the top of the About page." },
      { key: "about_story", label: "Full story", kind: "textarea", rows: 10, hint: "Leave an empty line between paragraphs." },
    ],
  },
  {
    title: "Contact details",
    hint: "Shown in the footer on every page and on the Contact page.",
    preview: "/contact",
    fields: [
      { key: "address", label: "Office address", kind: "textarea", rows: 3, hint: "Put each line of the address on its own line. The map uses this address." },
      { key: "phone", label: "Office phone (tel/fax)", kind: "tel", placeholder: "03-5888 3401" },
      { key: "mobile", label: "Mobile", kind: "tel", placeholder: "012-588 5590" },
      { key: "whatsapp", label: "WhatsApp number", kind: "tel", placeholder: "012-588 5590", hint: "Every WhatsApp button on the site opens a chat with this number." },
      { key: "email", label: "Main email", kind: "email" },
      { key: "alt_email", label: "Second email", kind: "email" },
    ],
  },
  {
    title: "Office hours",
    hint: "One line per day or group of days.",
    fields: [
      { key: "office_hours", label: "Office hours", kind: "textarea", rows: 4, placeholder: "Mon–Fri: 9am – 6pm\nSat: 9am – 1pm\nSun & public holidays: closed" },
    ],
  },
  {
    title: "Licences & memberships",
    hint: "Shown in the footer and on the About page to build trust.",
    fields: [
      { key: "motac_license", label: "MOTAC licence number", placeholder: "KPK/LN 9109" },
      { key: "company_reg", label: "Company registration number", placeholder: "1273862-K" },
      { key: "matta_member", label: "MATTA membership number", hint: "Leave blank if not a MATTA member." },
    ],
  },
  {
    title: "Social media",
    hint: "Paste the full link to each page. Leave blank to hide that icon.",
    fields: [
      { key: "facebook_url", label: "Facebook", kind: "url", placeholder: "https://www.facebook.com/…" },
      { key: "instagram_url", label: "Instagram", kind: "url", placeholder: "https://www.instagram.com/…" },
      { key: "tiktok_url", label: "TikTok", kind: "url", placeholder: "https://www.tiktok.com/@…" },
    ],
  },
];

/** AdminContentEditorPage [PKG-MTT-006-002] — REQ-MTT-006-001…007. */
export function ContentEditor({ initial }: { initial: SiteContent }) {
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<ContentErrors>({});
  const [banner, setBanner] = useState<{ tone: "error" | "success"; title: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = (Object.keys(values) as SiteContentKey[]).some((k) => values[k] !== saved[k]);

  // SRS A1: warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function fail(found: ContentErrors) {
    const count = Object.keys(found).length;
    setErrors(found);
    setBanner({ tone: "error", title: `Please fix ${count} error${count === 1 ? "" : "s"} before saving.` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function save() {
    const check = validateSiteContent(values);
    if (!check.ok) return fail(check.errors);
    startTransition(async () => {
      const result = await updateSiteContent(values);
      if (!result.ok) {
        if (result.errors) fail(result.errors);
        else setBanner({ tone: "error", title: result.message });
        return;
      }
      setErrors({});
      setSaved(result.values);
      setValues(result.values);
      setBanner({
        tone: "success",
        title: result.changed ? "Changes saved — the website is updated." : "No changes to save.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function discard() {
    if (!window.confirm("Discard your unsaved changes?")) return;
    setValues(saved);
    setErrors({});
    setBanner(null);
  }

  const actions = (
    <div className="flex flex-wrap items-center gap-2.5">
      {dirty && (
        <button type="button" onClick={discard} className="min-h-11 px-4 text-[14.5px] font-semibold text-muted hover:text-ink">
          Discard changes
        </button>
      )}
      <button
        type="button"
        onClick={save}
        disabled={pending || !dirty}
        className="min-h-11 rounded-lg bg-accent px-6 text-[14.5px] font-bold text-white hover:bg-accent-dark disabled:bg-line disabled:text-muted"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="mb-1 text-[23px]">Website content</h2>
          <p className="text-muted">Changes appear on the public website as soon as you save.</p>
        </div>
        {actions}
      </div>

      <div className="max-w-[760px]">
        {banner && (
          <div className="mb-5">
            <Alert tone={banner.tone} title={banner.title}>
              {banner.tone === "error" && Object.keys(errors).length > 0
                ? "The fields that need attention are highlighted below. Your other changes have been kept."
                : undefined}
            </Alert>
          </div>
        )}

        <div className="rounded-xl border border-line bg-white">
          {SECTIONS.map((section) => (
            <section key={section.title} className="border-b border-line px-5 py-7 last:border-b-0 sm:px-8">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="mb-1 text-[17px]">{section.title}</h3>
                  <p className="text-sm text-muted">{section.hint}</p>
                </div>
                {section.preview && (
                  <a
                    href={section.preview}
                    target="_blank"
                    className="flex shrink-0 items-center gap-1.5 text-[13.5px] font-semibold text-primary hover:underline"
                  >
                    View page
                    <ExternalIcon className="size-3.5" />
                  </a>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {section.fields.map((field) => {
                  const error = errors[field.key];
                  const optional = OPTIONAL_CONTENT_KEYS.includes(field.key);
                  const wide = field.kind === "textarea" || section.fields.length === 1;
                  const ids = [field.hint && `${field.key}-hint`, error && `${field.key}-error`].filter(Boolean).join(" ");
                  const props = {
                    id: field.key,
                    value: values[field.key],
                    placeholder: field.placeholder,
                    "aria-invalid": error ? true : undefined,
                    "aria-describedby": ids || undefined,
                    className: `w-full rounded-lg border-[1.5px] px-3.5 py-3 text-[15px] focus:border-primary focus:outline-none ${
                      error ? "border-danger bg-danger-pale" : "border-line bg-white"
                    }`,
                  };
                  const onChange = (v: string) => setValues((s) => ({ ...s, [field.key]: v }));
                  return (
                    <div key={field.key} className={wide ? "sm:col-span-2" : undefined}>
                      <label htmlFor={field.key} className="mb-2 block text-sm font-semibold">
                        {field.label}
                        {optional && <span className="font-normal text-muted"> (optional)</span>}
                      </label>
                      {field.kind === "textarea" ? (
                        <textarea
                          {...props}
                          rows={field.rows}
                          onChange={(e) => onChange(e.target.value)}
                          className={`${props.className} resize-y leading-relaxed`}
                        />
                      ) : (
                        <input
                          {...props}
                          type={field.kind ?? "text"}
                          inputMode={field.kind === "tel" ? "tel" : undefined}
                          onChange={(e) => onChange(e.target.value)}
                        />
                      )}
                      {field.hint && (
                        <p id={`${field.key}-hint`} className="mt-1.5 text-[13px] text-muted">
                          {field.hint}
                        </p>
                      )}
                      {error && (
                        <p id={`${field.key}-error`} className="mt-2 flex items-center gap-1.5 text-[13.5px] font-semibold text-danger">
                          <AlertCircleIcon className="size-3.5 shrink-0" />
                          {error}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 flex justify-end">{actions}</div>
      </div>
    </form>
  );
}

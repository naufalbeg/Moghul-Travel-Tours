"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveTestimonial } from "@/app/admin/(portal)/testimonials/actions";
import { Field, FieldError, describedBy, fieldClass, primaryButton } from "@/components/admin/field";
import { Alert } from "@/components/ui/alert";
import { validateTestimonial, type TestimonialErrors, type TestimonialInput } from "@/lib/validation/testimonial";

const EMPTY_TESTIMONIAL: TestimonialInput = {
  customerName: "",
  tripName: "",
  reviewText: "",
  starRating: 5,
  tripDate: "",
};

/** Add / edit testimonial form — AdminTestimonialsPanel [PKG-MTT-005-002]. */
/** Pass initial = null for a new testimonial. */
export function TestimonialForm({ id, initial }: { id: string | null; initial: TestimonialInput | null }) {
  const [values, setValues] = useState(initial ?? EMPTY_TESTIMONIAL);
  const [errors, setErrors] = useState<TestimonialErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof TestimonialInput>(key: K, value: TestimonialInput[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  function fail(found: TestimonialErrors, message?: string) {
    const count = Object.keys(found).length;
    setErrors(found);
    setBanner(message ?? `Please fix ${count} error${count === 1 ? "" : "s"} before saving.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function save() {
    const check = validateTestimonial(values);
    if (!check.ok) return fail(check.errors);
    startTransition(async () => {
      const result = await saveTestimonial(id, values);
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
      <h2 className="mb-6 text-[23px]">{id ? "Edit testimonial" : "Add testimonial"}</h2>

      {banner && (
        <div className="mb-5">
          <Alert tone="error" title={banner} />
        </div>
      )}

      <div className="space-y-5 rounded-xl border border-line bg-white px-5 py-7 sm:px-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="customerName" label="Customer name" error={errors.customerName}>
            <input
              id="customerName"
              value={values.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              placeholder="e.g. Siti Nurhaliza binti Ahmad"
              aria-invalid={Boolean(errors.customerName)}
              aria-describedby={describedBy("customerName", undefined, errors.customerName)}
              className={fieldClass(errors.customerName)}
            />
          </Field>
          <Field id="tripName" label="Trip or package" error={errors.tripName}>
            <input
              id="tripName"
              value={values.tripName}
              onChange={(e) => set("tripName", e.target.value)}
              placeholder="e.g. Umrah Sakinah 2026"
              aria-invalid={Boolean(errors.tripName)}
              aria-describedby={describedBy("tripName", undefined, errors.tripName)}
              className={fieldClass(errors.tripName)}
            />
          </Field>
        </div>

        <Field id="reviewText" label="What they said" error={errors.reviewText}>
          <textarea
            id="reviewText"
            rows={5}
            value={values.reviewText}
            onChange={(e) => set("reviewText", e.target.value)}
            placeholder="Their review, in their own words"
            aria-invalid={Boolean(errors.reviewText)}
            aria-describedby={describedBy("reviewText", undefined, errors.reviewText)}
            className={`${fieldClass(errors.reviewText)} resize-y leading-relaxed`}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Star rating</legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <label
                  key={n}
                  className="cursor-pointer rounded-md p-1 text-[32px] leading-none has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent"
                >
                  <input
                    type="radio"
                    name="starRating"
                    value={n}
                    checked={values.starRating === n}
                    onChange={() => set("starRating", n)}
                    className="sr-only"
                  />
                  <span aria-hidden="true" className={n <= values.starRating ? "text-accent" : "text-line"}>
                    ★
                  </span>
                  <span className="sr-only">
                    {n} star{n === 1 ? "" : "s"}
                  </span>
                </label>
              ))}
            </div>
            <FieldError id="starRating-error" message={errors.starRating} />
          </fieldset>

          <Field id="tripDate" label="Date of trip" optional error={errors.tripDate}>
            <input
              id="tripDate"
              type="date"
              value={values.tripDate}
              onChange={(e) => set("tripDate", e.target.value)}
              aria-describedby={describedBy("tripDate", undefined, errors.tripDate)}
              className={fieldClass(errors.tripDate)}
            />
          </Field>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5">
        <Link href="/admin/testimonials" className="flex min-h-11 items-center px-4 font-semibold text-muted hover:text-ink">
          Cancel
        </Link>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save testimonial"}
        </button>
      </div>
    </form>
  );
}

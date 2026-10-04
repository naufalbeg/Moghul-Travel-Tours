"use client";

import Link from "next/link";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { savePackage } from "@/app/admin/(portal)/packages/actions";
import { PackageImageField, type ImageItem } from "@/components/admin/package-image-field";
import { Alert } from "@/components/ui/alert";
import { AlertCircleIcon } from "@/components/ui/icons";
import type { DepartureAvailability, PackageAvailability, PackageCategory } from "@/generated/prisma/enums";
import { formatPrice } from "@/lib/format";
import { CATEGORY_LABEL, DEPARTURE_AVAILABILITY, PACKAGE_AVAILABILITY } from "@/lib/package-labels";
import {
  ROOMS,
  TRAVELLERS,
  buildGrid,
  gridToCells,
  startingPrice,
  type RoomKey,
  type TravellerKey,
} from "@/lib/package-prices";
import {
  AVAILABILITIES,
  CATEGORIES,
  DEPARTURE_AVAILABILITIES,
  slugify,
  validatePackage,
  type FieldErrors,
  type PackageInput,
  type SaveIntent,
} from "@/lib/validation/package";

type ItineraryRow = { key: string; dayStart: string; dayEnd: string; title: string; description: string };
type DepartureRow = { key: string; date: string; availability: DepartureAvailability };

export type PackageFormState = {
  title: string;
  slug: string;
  category: PackageCategory;
  description: string;
  highlights: string;
  inclusions: string;
  durationDays: string;
  durationNights: string;
  /** Price per person in RM for each traveller × room, as typed; blank = not offered. */
  prices: Record<TravellerKey, Record<RoomKey, string>>;
  availability: PackageAvailability;
  itinerary: ItineraryRow[];
  departures: DepartureRow[];
  images: ImageItem[];
};

const newKey = () => crypto.randomUUID();

const emptyPackageForm = (): PackageFormState => ({
  title: "",
  slug: "",
  category: "UMRAH_ZIARAH",
  description: "",
  highlights: "",
  inclusions: "",
  durationDays: "",
  durationNights: "",
  prices: buildGrid(() => ""),
  availability: "OPEN",
  // Fixed key: this row is rendered on the server too, so it must match on hydration.
  itinerary: [{ key: "first-day", dayStart: "1", dayEnd: "", title: "", description: "" }],
  departures: [],
  images: [],
});

const toNumber = (s: string) => (s.trim() === "" ? null : Number(s));
const toLines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** Converts form state to the shape savePackage validates. Blank rows are dropped. */
function toInput(s: PackageFormState): PackageInput {
  return {
    title: s.title,
    slug: s.slug,
    category: s.category,
    description: s.description,
    highlights: toLines(s.highlights),
    inclusions: toLines(s.inclusions),
    durationDays: toNumber(s.durationDays),
    durationNights: toNumber(s.durationNights),
    prices: buildGrid((traveller, room) => toNumber(s.prices[traveller][room])),
    availability: s.availability,
    itinerary: s.itinerary
      .filter((d) => d.title.trim() || d.description.trim())
      .map((d) => ({
        dayStart: toNumber(d.dayStart) ?? 0,
        dayEnd: toNumber(d.dayEnd),
        title: d.title,
        description: d.description,
      })),
    departures: s.departures.filter((d) => d.date).map((d) => ({ date: d.date, availability: d.availability })),
    images: s.images
      .filter((img) => img.status === "done" && img.storagePath)
      .map((img) => ({ storagePath: img.storagePath!, isPrimary: img.isPrimary })),
  };
}

const input =
  "w-full rounded-lg border-[1.5px] px-3.5 py-3 text-[15px] text-ink focus:border-primary focus:outline-none";
const inputClass = (error?: string) => `${input} ${error ? "border-danger bg-danger-pale" : "border-line bg-white"}`;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-[13.5px] font-semibold text-danger">
      <AlertCircleIcon className="size-3.5 shrink-0" />
      {message}
    </p>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-7 last:border-b-0 sm:px-8">
      <h3 className="mb-1 text-[17px]">{title}</h3>
      <p className="mb-5 text-sm text-muted">{hint}</p>
      {children}
    </section>
  );
}

/**
 * PackageFormPage [PKG-MTT-002-004] — mockups 3.2.4 (form) and 3.2.5
 * (validation errors). Used for both "Add new package" and "Edit".
 */
export function PackageForm({
  packageId,
  initial,
  isPublished,
}: {
  packageId: string | null;
  /** Null for a new package. */
  initial: PackageFormState | null;
  isPublished: boolean;
}) {
  const [state, setState] = useState(() => initial ?? emptyPackageForm());
  const [slugEdited, setSlugEdited] = useState(Boolean(packageId));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  // Warn before leaving with unsaved changes (older users, long form).
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update<K extends keyof PackageFormState>(key: K, value: PackageFormState[K]) {
    setDirty(true);
    setState((s) => {
      const next = { ...s, [key]: value };
      if (key === "title" && !slugEdited) next.slug = slugify(value as string);
      return next;
    });
  }

  function updatePrice(traveller: TravellerKey, room: RoomKey, value: string) {
    setDirty(true);
    setState((s) => ({
      ...s,
      prices: { ...s.prices, [traveller]: { ...s.prices[traveller], [room]: value } },
    }));
  }

  function updateRow<K extends "itinerary" | "departures">(
    key: K,
    rowKey: string,
    patch: Partial<PackageFormState[K][number]>,
  ) {
    setDirty(true);
    setState((s) => ({
      ...s,
      [key]: (s[key] as { key: string }[]).map((row) => (row.key === rowKey ? { ...row, ...patch } : row)),
    }));
  }

  function removeRow(key: "itinerary" | "departures", rowKey: string) {
    setDirty(true);
    setState((s) => ({ ...s, [key]: (s[key] as { key: string }[]).filter((row) => row.key !== rowKey) }));
  }

  function addDay() {
    setDirty(true);
    setState((s) => {
      const last = s.itinerary.at(-1);
      const next = last ? (toNumber(last.dayEnd) ?? toNumber(last.dayStart) ?? 0) + 1 : 1;
      return {
        ...s,
        itinerary: [...s.itinerary, { key: newKey(), dayStart: String(next), dayEnd: "", title: "", description: "" }],
      };
    });
  }

  function addDeparture() {
    setDirty(true);
    setState((s) => ({ ...s, departures: [...s.departures, { key: newKey(), date: "", availability: "OPEN" }] }));
  }

  const uploading = state.images.some((img) => img.status === "uploading");
  const fromPrice = startingPrice(gridToCells(toInput(state).prices));

  function submit(intent: SaveIntent) {
    if (uploading) {
      setBanner("Please wait for the photos to finish uploading.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const data = toInput(state);
    const check = validatePackage(data, intent);
    if (!check.ok) {
      showErrors(check.errors, intent);
      return;
    }
    startTransition(async () => {
      setDirty(false);
      const result = await savePackage(packageId, data, intent);
      // Success redirects to the list; we only get here on failure.
      setDirty(true);
      if (result.errors) showErrors(result.errors, intent);
      else {
        setErrors({});
        setBanner(result.message);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  function showErrors(found: FieldErrors, intent: SaveIntent) {
    const count = Object.keys(found).length;
    setErrors(found);
    setBanner(`Please fix ${count} error${count === 1 ? "" : "s"} before ${intent === "publish" ? "publishing" : "saving"}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const err = (key: string) => errors[key];
  // A specific cell's error first — fixing it often fixes the general one too.
  const priceError = Object.entries(errors).find(([k]) => k.startsWith("prices."))?.[1] ?? err("prices");
  const describedBy = (key: string) => (errors[key] ? `${key}-error` : undefined);

  // Itinerary/departure errors are keyed by the index among the rows we send
  // (blank rows are skipped), so map row → submitted index.
  let sentDay = -1;
  const dayIndex = state.itinerary.map((d) => (d.title.trim() || d.description.trim() ? ++sentDay : -1));
  let sentDate = -1;
  const dateIndex = state.departures.map((d) => (d.date ? ++sentDate : -1));

  const actions = (
    <div className="flex flex-wrap items-center gap-2.5">
      <Link
        href="/admin/packages"
        onClick={(e) => {
          if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) e.preventDefault();
        }}
        className="flex min-h-11 items-center px-4 text-[14.5px] font-semibold text-muted hover:text-ink"
      >
        Cancel
      </Link>
      <button
        type="button"
        onClick={() => submit("draft")}
        disabled={pending}
        className="min-h-11 rounded-lg border-[1.5px] border-line bg-white px-5 text-[14.5px] font-bold hover:border-primary disabled:opacity-60"
      >
        {isPublished ? "Move to drafts" : "Save as draft"}
      </button>
      <button
        type="button"
        onClick={() => submit("publish")}
        disabled={pending}
        className="min-h-11 rounded-lg bg-accent px-6 text-[14.5px] font-bold text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : isPublished ? "Save changes" : "Publish"}
      </button>
    </div>
  );

  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-[23px]">
          {packageId ? "Edit package" : "Add new package"}
          {packageId && (
            <span
              className={`ml-3 inline-block rounded-full px-3 py-1 align-middle font-sans text-xs font-bold ${
                isPublished ? "bg-success-pale text-success" : "bg-primary-pale text-primary"
              }`}
            >
              {isPublished ? "Published" : "Draft"}
            </span>
          )}
        </h2>
        {actions}
      </div>

      <div>
        {banner && (
          <div className="mb-5">
            <Alert tone="error" title={banner}>
              {Object.keys(errors).length > 0 ? "The fields that need attention are highlighted below. Your other changes have been kept." : undefined}
            </Alert>
          </div>
        )}

        <div className="rounded-xl border border-line bg-white">
          <Section title="Basic details" hint="The name and category visitors will see first.">
            <div className="mb-5 grid gap-5 xl:grid-cols-2">
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-semibold">
                  Package title
                </label>
                <input
                  id="title"
                  value={state.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Umrah Sakinah — 10 days"
                  aria-invalid={Boolean(err("title"))}
                  aria-describedby={describedBy("title")}
                  className={inputClass(err("title"))}
                />
                <FieldError id="title-error" message={err("title")} />
              </div>
              <div>
                <label htmlFor="slug" className="mb-2 block text-sm font-semibold">
                  Web address
                </label>
                <div className="flex items-stretch">
                  <span className="hidden items-center rounded-l-lg border-[1.5px] border-r-0 border-line bg-canvas px-3 text-sm text-muted sm:flex">
                    moghultt.com/packages/
                  </span>
                  <input
                    id="slug"
                    value={state.slug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      update("slug", e.target.value.toLowerCase());
                    }}
                    placeholder="filled in from the title"
                    aria-invalid={Boolean(err("slug"))}
                    aria-describedby={describedBy("slug") ?? "slug-hint"}
                    className={`${inputClass(err("slug"))} sm:rounded-l-none`}
                  />
                </div>
                <p id="slug-hint" className="mt-1.5 text-[13px] text-muted">
                  {packageId
                    ? "Changing this breaks links people have already shared."
                    : "Filled in automatically from the title. Leave it as is unless you want a shorter link."}
                </p>
                <FieldError id="slug-error" message={err("slug")} />
              </div>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Category</legend>
              <div className="flex flex-wrap gap-2.5">
                {CATEGORIES.map((c) => (
                  <label
                    key={c}
                    className={`flex min-h-11 cursor-pointer items-center rounded-full border-[1.5px] px-[18px] text-[14.5px] font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent ${
                      state.category === c ? "border-primary bg-primary text-white" : "border-line text-ink hover:border-primary"
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={c}
                      checked={state.category === c}
                      onChange={() => update("category", c)}
                      className="sr-only"
                    />
                    {CATEGORY_LABEL[c]}
                  </label>
                ))}
              </div>
            </fieldset>
          </Section>

          <Section title="Description" hint="A short overview shown at the top of the package page.">
            <textarea
              id="description"
              aria-label="Description"
              value={state.description}
              onChange={(e) => update("description", e.target.value)}
              rows={8}
              placeholder="Describe what makes this journey special..."
              aria-invalid={Boolean(err("description"))}
              aria-describedby={describedBy("description")}
              className={`${inputClass(err("description"))} min-h-52 resize-y leading-relaxed field-sizing-content`}
            />
            <FieldError id="description-error" message={err("description")} />

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="highlights" className="mb-2 block text-sm font-semibold">
                  Highlights <span className="font-normal text-muted">(one per line, shown on cards)</span>
                </label>
                <textarea
                  id="highlights"
                  value={state.highlights}
                  onChange={(e) => update("highlights", e.target.value)}
                  rows={4}
                  placeholder={"Makkah & Madinah, 4-star hotels\nExperienced group leader"}
                  aria-describedby={describedBy("highlights")}
                  className={`${inputClass(err("highlights"))} resize-y`}
                />
                <FieldError id="highlights-error" message={err("highlights")} />
              </div>
              <div>
                <label htmlFor="inclusions" className="mb-2 block text-sm font-semibold">
                  What&apos;s included <span className="font-normal text-muted">(one per line)</span>
                </label>
                <textarea
                  id="inclusions"
                  value={state.inclusions}
                  onChange={(e) => update("inclusions", e.target.value)}
                  rows={4}
                  placeholder={"Return flights from Kuala Lumpur\nVisa processing"}
                  aria-describedby={describedBy("inclusions")}
                  className={`${inputClass(err("inclusions"))} resize-y`}
                />
                <FieldError id="inclusions-error" message={err("inclusions")} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-[9rem_9rem]">
              <div>
                <label htmlFor="durationDays" className="mb-2 block text-sm font-semibold">
                  Days
                </label>
                <input
                  id="durationDays"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={state.durationDays}
                  onChange={(e) => update("durationDays", e.target.value)}
                  placeholder="10"
                  aria-describedby={describedBy("durationDays")}
                  className={inputClass(err("durationDays"))}
                />
                <FieldError id="durationDays-error" message={err("durationDays")} />
              </div>
              <div>
                <label htmlFor="durationNights" className="mb-2 block text-sm font-semibold">
                  Nights
                </label>
                <input
                  id="durationNights"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={state.durationNights}
                  onChange={(e) => update("durationNights", e.target.value)}
                  placeholder="9"
                  aria-describedby={describedBy("durationNights")}
                  className={inputClass(err("durationNights"))}
                />
                <FieldError id="durationNights-error" message={err("durationNights")} />
              </div>
            </div>
          </Section>

          <Section title="Itinerary" hint="Add a day-by-day breakdown. Visitors see this on the package page.">
            <ol className="space-y-4">
              {state.itinerary.map((day, i) => {
                const idx = dayIndex[i];
                const e = (f: string) => (idx >= 0 ? err(`itinerary.${idx}.${f}`) : undefined);
                return (
                  <li key={day.key} className="rounded-[10px] bg-canvas p-4">
                    <div className="mb-3 flex flex-wrap items-end gap-3">
                      <div>
                        <label htmlFor={`day-start-${day.key}`} className="mb-1 block text-[13px] font-semibold">
                          Day
                        </label>
                        <input
                          id={`day-start-${day.key}`}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={day.dayStart}
                          onChange={(ev) => updateRow("itinerary", day.key, { dayStart: ev.target.value })}
                          className={`${inputClass(e("dayStart"))} max-w-24 py-2`}
                        />
                      </div>
                      <div>
                        <label htmlFor={`day-end-${day.key}`} className="mb-1 block text-[13px] font-semibold">
                          to day <span className="font-normal text-muted">(optional)</span>
                        </label>
                        <input
                          id={`day-end-${day.key}`}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={day.dayEnd}
                          onChange={(ev) => updateRow("itinerary", day.key, { dayEnd: ev.target.value })}
                          className={`${inputClass(e("dayEnd"))} max-w-24 py-2`}
                        />
                      </div>
                      <div className="min-w-56 flex-1">
                        <label htmlFor={`day-title-${day.key}`} className="mb-1 block text-[13px] font-semibold">
                          Title
                        </label>
                        <input
                          id={`day-title-${day.key}`}
                          value={day.title}
                          onChange={(ev) => updateRow("itinerary", day.key, { title: ev.target.value })}
                          placeholder="e.g. Depart Kuala Lumpur → Madinah"
                          className={`${inputClass(e("title"))} py-2`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow("itinerary", day.key)}
                        className="min-h-10 px-2 text-[13px] font-semibold text-danger"
                      >
                        Remove day
                      </button>
                    </div>
                    <label htmlFor={`day-desc-${day.key}`} className="sr-only">
                      What happens this day
                    </label>
                    <textarea
                      id={`day-desc-${day.key}`}
                      value={day.description}
                      onChange={(ev) => updateRow("itinerary", day.key, { description: ev.target.value })}
                      rows={3}
                      placeholder="What happens this day"
                      className={`${inputClass(e("description"))} min-h-24 resize-y py-2.5 field-sizing-content`}
                    />
                    <FieldError id={`day-${day.key}-error`} message={e("title") ?? e("dayStart") ?? e("dayEnd")} />
                  </li>
                );
              })}
            </ol>
            <button
              type="button"
              onClick={addDay}
              className="mt-4 block min-h-12 w-full rounded-lg border-[1.5px] border-dashed border-line text-[14.5px] font-semibold text-primary hover:border-primary"
            >
              + Add another day
            </button>
          </Section>

          <Section
            title="Prices & availability"
            hint="Prices are per person, in RM. Fill in the ones this package offers and leave the rest blank — blank prices don't appear on the website."
          >
            <table className="w-full max-w-2xl">
              <thead>
                <tr>
                  <td className="w-16 sm:w-28" />
                  {ROOMS.map((room) => (
                    <th
                      key={room.key}
                      id={`room-${room.key}`}
                      scope="col"
                      className="px-1.5 pb-2 text-left align-bottom text-sm font-semibold sm:px-2.5"
                    >
                      {room.label}
                      <span className="block font-normal text-muted">{room.hint}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRAVELLERS.map((traveller) => (
                  <tr key={traveller.key}>
                    <th
                      id={`traveller-${traveller.key}`}
                      scope="row"
                      className="py-1.5 pr-2 text-left text-sm font-semibold"
                    >
                      {traveller.label}
                    </th>
                    {ROOMS.map((room) => {
                      const key = `prices.${traveller.key}.${room.key}`;
                      return (
                        <td key={room.key} className="px-1.5 py-1.5 sm:px-2.5">
                          <div className="flex items-stretch">
                            {/* No room for the RM tag on phones; the section hint says "in RM". */}
                            <span className="hidden items-center rounded-l-lg border-[1.5px] border-r-0 border-line bg-canvas px-3.5 text-sm font-bold text-muted sm:flex">
                              RM
                            </span>
                            <input
                              id={key}
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step="0.01"
                              value={state.prices[traveller.key][room.key]}
                              onChange={(e) => updatePrice(traveller.key, room.key, e.target.value)}
                              aria-labelledby={`traveller-${traveller.key} room-${room.key}`}
                              aria-invalid={Boolean(err(key))}
                              aria-describedby={err(key) || err("prices") ? "prices-error" : undefined}
                              className={`${inputClass(err(key))} min-w-0 sm:rounded-l-none`}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <FieldError id="prices-error" message={priceError} />

            <p className="mt-5 rounded-lg bg-primary-pale px-4 py-3 text-[14.5px] text-ink">
              {fromPrice !== null ? (
                <>
                  The website shows <strong>Starts from {formatPrice(fromPrice)}</strong> per person — the lowest
                  adult price.
                </>
              ) : (
                <>
                  The website shows the lowest adult price as the &ldquo;Starts from&rdquo; price. Fill in at least
                  one adult price before publishing.
                </>
              )}
            </p>

            <div className="mt-5 sm:max-w-sm">
              <label htmlFor="availability" className="mb-2 block text-sm font-semibold">
                Availability status
              </label>
              <select
                id="availability"
                value={state.availability}
                onChange={(e) => update("availability", e.target.value as PackageAvailability)}
                className={inputClass()}
              >
                {AVAILABILITIES.map((a) => (
                  <option key={a} value={a}>
                    {PACKAGE_AVAILABILITY[a].label}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          <Section title="Departure dates" hint="Add upcoming departure dates. Past dates hide themselves on the website.">
            {err("departures") && <FieldError id="departures-error" message={err("departures")} />}
            <ul className="grid gap-3 xl:grid-cols-2 xl:gap-x-8">
              {state.departures.map((d, i) => {
                const idx = dateIndex[i];
                const e = idx >= 0 ? err(`departures.${idx}.date`) : undefined;
                return (
                  <li key={d.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,11rem)_auto]">
                    <label htmlFor={`date-${d.key}`} className="sr-only">
                      Departure date
                    </label>
                    <input
                      id={`date-${d.key}`}
                      type="date"
                      value={d.date}
                      onChange={(ev) => updateRow("departures", d.key, { date: ev.target.value })}
                      className={`${inputClass(e)} col-span-2 sm:col-span-1`}
                    />
                    <label htmlFor={`date-avail-${d.key}`} className="sr-only">
                      Seats
                    </label>
                    <select
                      id={`date-avail-${d.key}`}
                      value={d.availability}
                      onChange={(ev) =>
                        updateRow("departures", d.key, { availability: ev.target.value as DepartureAvailability })
                      }
                      className={inputClass()}
                    >
                      {DEPARTURE_AVAILABILITIES.map((a) => (
                        <option key={a} value={a}>
                          {DEPARTURE_AVAILABILITY[a].label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeRow("departures", d.key)}
                      className="min-h-10 px-2 text-[13px] font-semibold text-danger"
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={addDeparture}
              className="mt-4 block min-h-12 w-full rounded-lg border-[1.5px] border-dashed border-line text-[14.5px] font-semibold text-primary hover:border-primary"
            >
              + Add {state.departures.length ? "another" : "a"} date
            </button>
          </Section>

          <Section title="Images" hint="At least one image is required before this package can be published.">
            <PackageImageField
              images={state.images}
              onChange={(fn) => {
                setDirty(true);
                setState((s) => ({ ...s, images: fn(s.images) }));
              }}
              error={err("images")}
            />
          </Section>
        </div>

        <div className="mt-6 flex justify-end">{actions}</div>
      </div>
    </form>
  );
}

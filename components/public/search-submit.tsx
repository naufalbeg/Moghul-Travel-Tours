"use client";

import { useFormStatus } from "react-dom";
import { useI18n } from "@/components/public/i18n-provider";
import { SearchIcon } from "@/components/ui/icons";

/** The search bar's button: shows that the search has started until the results arrive. */
export function SearchSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <button type="submit" aria-busy={pending || undefined} className="btn btn-accent">
      {pending ? <span className="spinner" aria-hidden="true" /> : <SearchIcon className="size-[22px]" />}
      <span>{pending ? t.search.searching : label}</span>
    </button>
  );
}

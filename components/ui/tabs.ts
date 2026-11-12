// Filter tabs: a row of plain text links, the chosen one marked the way the
// top menu marks the current page (dark text, orange underline), each with
// its count beside it. Used for package categories, gallery labels and the
// admin lists' status filters. Not pills: no outlines, no filled capsules.

/** The row: a hairline under it; wraps onto more lines on phones. */
export const tabListClass = "flex flex-wrap gap-x-7 border-b border-line";

export const tabClass = (active: boolean) =>
  `-mb-px inline-flex min-h-12 items-center gap-2 border-b-[3px] font-bold whitespace-nowrap transition-colors duration-150 ease-smooth ${
    active ? "border-accent text-primary-dark" : "border-transparent text-muted hover:border-field hover:text-ink"
  }`;

/** The number after a tab's label. */
export const tabCountClass = "text-[0.85em] font-normal text-muted tabular-nums";

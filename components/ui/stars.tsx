const STAR = "m12 2 3.1 6.3 6.9 1-5 4.9L18.2 21 12 17.8 5.8 21 7 14.2l-5-4.9 6.9-1z";

/**
 * A star rating out of five, drawn as icons (not "★" text): the earned stars
 * are filled orange with a darker outline so they pass contrast, the rest are
 * outlines. `label` is what a screen reader says, e.g. "4 out of 5 stars".
 */
export function Stars({ rating, label, className = "size-5" }: { rating: number; label: string; className?: string }) {
  return (
    <span role="img" aria-label={label} className="inline-flex gap-0.5 align-middle">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
          strokeWidth={1.5}
          strokeLinejoin="round"
          className={`${className} ${n <= rating ? "fill-accent stroke-accent-dark" : "fill-none stroke-field"}`}
        >
          <path d={STAR} />
        </svg>
      ))}
    </span>
  );
}

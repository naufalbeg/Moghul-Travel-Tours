/**
 * Shown inside the admin shell while a page's data loads: the outline of a
 * title, a toolbar and a list, so the sidebar and top bar stay put and the
 * page doesn't jump when the content arrives.
 */
export default function AdminLoading() {
  return (
    <div role="status" aria-label="Loading">
      <div className="skeleton mb-2 h-8 w-56" />
      <div className="skeleton mb-7 h-5 w-80 max-w-full" />
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="border-b border-line bg-canvas px-5 py-4">
          <div className="skeleton h-4 w-40" />
        </div>
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
            <div className="skeleton size-[46px] shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton h-4 w-2/5" />
              <div className="skeleton h-3.5 w-1/4" />
            </div>
            <div className="skeleton hidden h-8 w-24 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

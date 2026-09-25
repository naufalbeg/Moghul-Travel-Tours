import { MegaphoneIcon } from "@/components/ui/icons";
import { getActiveAnnouncements } from "@/lib/announcements";

/**
 * AnnouncementBanner [PKG-MTT-007-001] — the orange promo strip at the top of
 * every public page. Renders nothing when there are no live announcements.
 */
export async function AnnouncementBar() {
  const announcements = await getActiveAnnouncements();
  if (announcements.length === 0) return null;

  return (
    <section aria-label="Announcements" className="bg-accent text-white">
      <ul className="divide-y divide-white/25">
        {announcements.map((a) => (
          <li key={a.id} className="mx-auto flex max-w-[1160px] items-start justify-center gap-2.5 px-4 py-2.5 text-center text-[15px] sm:px-8">
            <MegaphoneIcon className="mt-0.5 hidden size-[18px] shrink-0 sm:block" />
            <p>
              <strong className="font-bold">{a.title}</strong>
              <span className="mx-1.5" aria-hidden="true">
                —
              </span>
              <span className="font-medium">{a.body}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

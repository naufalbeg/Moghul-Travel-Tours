import { MegaphoneIcon } from "@/components/ui/icons";
import { getActiveAnnouncements } from "@/lib/announcements";
import { getDictionary } from "@/lib/i18n/server";

/**
 * AnnouncementBanner [PKG-MTT-007-001] — the orange promo strip at the top of
 * every public page (ink text: white on this orange fails contrast). Renders nothing when there are no live announcements.
 */
export async function AnnouncementBar() {
  const announcements = await getActiveAnnouncements();
  if (announcements.length === 0) return null;
  const t = await getDictionary();

  return (
    <section aria-label={t.layout.announcements} className="bg-accent text-ink">
      <ul className="divide-y divide-ink/20">
        {announcements.map((a) => (
          <li key={a.id} className="wrap flex items-start justify-center gap-2.5 py-2.5 text-center text-meta">
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

import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { PageHeader, primaryButton } from "@/components/admin/field";
import { Alert } from "@/components/ui/alert";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { malaysianDate } from "@/lib/validation/announcement";
import { deleteAnnouncement, setAnnouncementStatus } from "./actions";

export const metadata: Metadata = { title: "Announcements" };

const pillClass = {
  live: "bg-success-pale text-success",
  ended: "bg-line text-muted",
  off: "bg-line text-muted",
} as const;

/** AdminAnnouncementsPanel [PKG-MTT-007-002] — REQ-MTT-007-005/006. */
export default async function AdminAnnouncementsPage({ searchParams }: PageProps<"/admin/announcements">) {
  await requireAdmin();
  const saved = (await searchParams).saved;
  const now = new Date();
  const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });

  const addButton = (
    <Link href="/admin/announcements/new" className={primaryButton}>
      <PlusIcon className="size-[18px]" />
      Post announcement
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Promotions and notices shown in the orange bar at the top of the website."
        action={addButton}
      />

      {typeof saved === "string" && (
        <div className="mb-5">
          <Alert tone="success" title={`“${saved}” is saved.`}>
            Live announcements show at the top of every page straight away.
          </Alert>
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="rounded-xl border border-line bg-white px-6 py-14 text-center">
          <h3 className="mb-2 text-lg">No announcements</h3>
          <p className="mb-6 text-muted">
            Post an early-bird promo or a notice — it appears as an orange bar across the top of the website.
          </p>
          <div className="flex justify-center">{addButton}</div>
        </div>
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => {
            const pastDate = a.expiresAt !== null && a.expiresAt <= now;
            const state = a.status === "EXPIRED" ? "off" : pastDate ? "ended" : "live";
            const endLabel = a.expiresAt ? formatDate(new Date(`${malaysianDate(a.expiresAt)}T00:00:00Z`)) : null;
            const label = {
              live: endLabel ? `Live until ${endLabel}` : "Live",
              ended: `Ended ${endLabel}`,
              off: "Turned off",
            }[state];

            return (
              <li key={a.id} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <span className={`mb-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${pillClass[state]}`}>{label}</span>
                  <p className={`font-semibold ${state === "live" ? "" : "text-muted"}`}>{a.title}</p>
                  <p className="text-[15px] text-muted">{a.body}</p>
                  {state === "ended" && (
                    <p className="mt-1 text-[13px] text-muted">Edit it and choose a later date to show it again.</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/admin/announcements/${a.id}/edit`}
                    className="flex min-h-9 items-center gap-1.5 rounded-[7px] border border-line px-3 text-[13.5px] font-semibold hover:border-primary"
                  >
                    <EditIcon className="size-3.5" />
                    Edit
                  </Link>
                  {a.status === "ACTIVE" && !pastDate && (
                    <ConfirmActionButton
                      label="Turn off"
                      tone="neutral"
                      title="Take this announcement down?"
                      confirmLabel="Turn off"
                      action={setAnnouncementStatus.bind(null, a.id, "EXPIRED")}
                    >
                      It will stop showing on the website now. You can turn it back on later.
                    </ConfirmActionButton>
                  )}
                  {a.status === "EXPIRED" && (
                    <ConfirmActionButton
                      label="Turn back on"
                      tone="neutral"
                      title="Show this announcement again?"
                      confirmLabel="Turn on"
                      action={setAnnouncementStatus.bind(null, a.id, "ACTIVE")}
                    >
                      {pastDate
                        ? "Its end date has already passed, so also edit the date or it will stay hidden."
                        : "It will show at the top of the website again straight away."}
                    </ConfirmActionButton>
                  )}
                  <ConfirmActionButton
                    label="Delete"
                    icon={<TrashIcon className="size-3.5" />}
                    title="Delete this announcement?"
                    confirmLabel="Delete announcement"
                    action={deleteAnnouncement.bind(null, a.id)}
                  >
                    <strong className="text-ink">{a.title}</strong> will be deleted permanently.
                  </ConfirmActionButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

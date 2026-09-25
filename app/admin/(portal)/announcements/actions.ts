"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  endOfMalaysianDay,
  validateAnnouncement,
  type AnnouncementErrors,
  type AnnouncementInput,
} from "@/lib/validation/announcement";

// AnnouncementController (SDD 4.2.7). Expiry is checked when pages render
// (status ACTIVE and expires_at in the future) — no cron job needed.

const EXPIRED_SESSION = { ok: false, message: "Your session has expired. Please sign in again." };

export type SaveAnnouncementFailure = { ok: false; message: string; errors?: AnnouncementErrors };

/**
 * createAnnouncement / updateAnnouncement — REQ-MTT-007-001/002/005. New
 * announcements go live immediately; editing keeps the current status.
 */
export async function saveAnnouncement(id: string | null, input: AnnouncementInput): Promise<SaveAnnouncementFailure> {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return EXPIRED_SESSION as SaveAnnouncementFailure;
  if (id !== null && !z.uuid().safeParse(id).success) return { ok: false, message: "Unknown announcement." };

  const result = validateAnnouncement(input);
  if (!result.ok) {
    const count = Object.keys(result.errors).length;
    return { ok: false, message: `Please fix ${count} error${count === 1 ? "" : "s"} before saving.`, errors: result.errors };
  }
  const { title, body, expiresOn } = result.values;
  const data = { title, body, expiresAt: expiresOn ? endOfMalaysianDay(expiresOn) : null };

  let saved;
  if (id) {
    const exists = await prisma.announcement.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return { ok: false, message: "This announcement no longer exists." };
    saved = await prisma.announcement.update({ where: { id }, data });
  } else {
    saved = await prisma.announcement.create({ data: { ...data, status: "ACTIVE", createdById: auth.admin.id } });
  }

  await logAudit({
    userId: auth.admin.id,
    action: id ? "UPDATE_ANNOUNCEMENT" : "CREATE_ANNOUNCEMENT",
    target: `announcements:${saved.id}`,
    detail: { title: saved.title },
  });
  revalidatePath("/admin/announcements");
  redirect(`/admin/announcements?saved=${encodeURIComponent(saved.title)}`);
}

/** expireAnnouncement (REQ-MTT-007-006) and its undo. */
export async function setAnnouncementStatus(id: string, status: "ACTIVE" | "EXPIRED") {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return EXPIRED_SESSION;
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Unknown announcement." };

  const updated = await prisma.announcement.updateMany({ where: { id }, data: { status } });
  if (updated.count === 0) return { ok: false, message: "This announcement no longer exists." };

  await logAudit({
    userId: auth.admin.id,
    action: status === "EXPIRED" ? "EXPIRE_ANNOUNCEMENT" : "REACTIVATE_ANNOUNCEMENT",
    target: `announcements:${id}`,
  });
  revalidatePath("/admin/announcements");
  return { ok: true };
}

/** deleteAnnouncement — REQ-MTT-007-006. */
export async function deleteAnnouncement(id: string) {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return EXPIRED_SESSION;
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Unknown announcement." };

  const existing = await prisma.announcement.findUnique({ where: { id }, select: { title: true } });
  if (!existing) return { ok: false, message: "This announcement was already deleted." };

  await prisma.announcement.delete({ where: { id } });
  await logAudit({
    userId: auth.admin.id,
    action: "DELETE_ANNOUNCEMENT",
    target: `announcements:${id}`,
    detail: { title: existing.title },
  });
  revalidatePath("/admin/announcements");
  return { ok: true };
}

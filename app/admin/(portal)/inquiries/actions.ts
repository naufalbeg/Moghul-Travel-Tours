"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Admin side of InquiryController (SDD 4.2.3).

const EXPIRED = { ok: false, message: "Your session has expired. Please sign in again." };
const STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED"] as const;

/** updateInquiryStatus — REQ-MTT-003-008. */
export async function updateInquiryStatus(
  id: string,
  status: (typeof STATUSES)[number],
): Promise<{ ok: boolean; message?: string }> {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return EXPIRED;
  if (!z.uuid().safeParse(id).success || !STATUSES.includes(status)) return { ok: false, message: "Unknown inquiry." };

  const updated = await prisma.inquiry.updateMany({ where: { id }, data: { status } });
  if (updated.count === 0) return { ok: false, message: "This inquiry no longer exists." };

  await logAudit({ userId: auth.admin.id, action: "UPDATE_INQUIRY_STATUS", target: `inquiries:${id}`, detail: { status } });
  // Refresh the list, this page and the sidebar's "new" badge.
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** deleteInquiry — REQ-MTT-003-009. Only resolved inquiries (SRS A2); hard delete. */
export async function deleteInquiry(id: string): Promise<{ ok: boolean; message?: string }> {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return EXPIRED;
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Unknown inquiry." };

  const inquiry = await prisma.inquiry.findUnique({ where: { id }, select: { status: true, fullName: true } });
  if (!inquiry) return { ok: false, message: "This inquiry was already deleted." };
  if (inquiry.status !== "RESOLVED") return { ok: false, message: "Mark the inquiry as resolved before deleting it." };

  await prisma.inquiry.delete({ where: { id } });
  await logAudit({ userId: auth.admin.id, action: "DELETE_INQUIRY", target: `inquiries:${id}`, detail: { fullName: inquiry.fullName } });
  revalidatePath("/admin", "layout");
  redirect(`/admin/inquiries?deleted=${encodeURIComponent(inquiry.fullName)}`);
}

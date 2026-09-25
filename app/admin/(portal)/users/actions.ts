"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { sendInvitationEmail } from "@/lib/email";
import { INVITE_HOURS, issuePasswordToken, setPasswordUrl } from "@/lib/password-tokens";
import { prisma } from "@/lib/prisma";
import { requestOrigin } from "@/lib/request-origin";
import { createAdminClient } from "@/lib/supabase/admin";

// AuthController account management (SDD 4.2.1). Master Admin only —
// checked in every action, not just hidden in the UI.

const EXPIRED = { ok: false as const, message: "Your session has expired. Please sign in again." };
const FORBIDDEN = { ok: false as const, message: "Only the Master Admin can manage staff accounts." };

export type InviteResult =
  | { ok: true; name: string; email: string; emailSent: boolean; link?: string }
  | { ok: false; message: string; errors?: { name?: string; email?: string } };

const inviteSchema = z.object({
  name: z.string().trim().min(1, "Enter the staff member's full name.").max(100),
  email: z
    .email("Enter a valid email address.")
    .max(120)
    .transform((e) => e.trim().toLowerCase()),
});

async function requireMaster() {
  const auth = await authorize("MASTER_ADMIN");
  if (auth.ok) return { ok: true as const, admin: auth.admin };
  return { ok: false as const, result: auth.response.status === 401 ? EXPIRED : FORBIDDEN };
}

/** Issues a fresh 24h link and emails it. If the email fails, hands the link back to share another way. */
async function sendInvite(user: { id: string; name: string; email: string }, invitedBy: string) {
  const token = await issuePasswordToken(user.id, INVITE_HOURS);
  const link = setPasswordUrl(await requestOrigin(), token);
  const emailSent = await sendInvitationEmail(user.email, user.name, invitedBy, link);
  return { emailSent, link: emailSent ? undefined : link };
}

/** inviteAdmin — REQ-MTT-001-003/004. */
export async function inviteAdmin(input: { name: string; email: string }): Promise<InviteResult> {
  const master = await requireMaster();
  if (!master.ok) return master.result;

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    const errors: { name?: string; email?: string } = {};
    for (const issue of parsed.error.issues) errors[issue.path[0] as "name" | "email"] ??= issue.message;
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }
  const { name, email } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { joinedAt: true } });
  if (existing) {
    return {
      ok: false,
      message: existing.joinedAt
        ? "Someone with this email already has an admin account."
        : "This person has already been invited — use “Resend invite” on their row.",
      errors: { email: "Already in the list below." },
    };
  }

  // The auth user gets a random password nobody knows; they choose their
  // own through the invitation link.
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password: `${randomBytes(24).toString("base64url")}!9`,
    user_metadata: { name },
  });
  if (error || !data.user) {
    console.error("createUser failed", error);
    return {
      ok: false,
      message:
        error?.code === "email_exists"
          ? "This email is already registered in the sign-in system. Please contact support."
          : "We couldn't create the account. Please try again.",
    };
  }

  try {
    await prisma.user.create({ data: { id: data.user.id, email, name, role: "ADMIN", joinedAt: null } });
  } catch (dbError) {
    console.error("Creating users row failed — rolling back auth user", dbError);
    await supabase.auth.admin.deleteUser(data.user.id);
    return { ok: false, message: "We couldn't create the account. Please try again." };
  }

  const sent = await sendInvite({ id: data.user.id, name, email }, master.admin.name);
  await logAudit({
    userId: master.admin.id,
    action: "INVITE_ADMIN",
    target: `users:${data.user.id}`,
    detail: { name, email, emailSent: sent.emailSent },
  });
  revalidatePath("/admin/users");
  return { ok: true, name, email, ...sent };
}

/** SRS A1: send a new invitation link (the old one stops working). */
export async function resendInvite(userId: string): Promise<InviteResult> {
  const master = await requireMaster();
  if (!master.ok) return master.result;
  if (!z.uuid().safeParse(userId).success) return { ok: false, message: "Unknown account." };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, joinedAt: true } });
  if (!user) return { ok: false, message: "This account no longer exists." };
  if (user.joinedAt) return { ok: false, message: `${user.name} has already set up their account.` };

  const sent = await sendInvite(user, master.admin.name);
  await logAudit({ userId: master.admin.id, action: "RESEND_INVITE", target: `users:${user.id}`, detail: { emailSent: sent.emailSent } });
  revalidatePath("/admin/users");
  return { ok: true, name: user.name, email: user.email, ...sent };
}

/** Loads a staff account the Master Admin may change (never the Master Admin). */
async function modifiableUser(userId: string, masterId: string) {
  if (!z.uuid().safeParse(userId).success) return { error: "Unknown account." } as const;
  if (userId === masterId) return { error: "You can't change your own account here." } as const;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true } });
  if (!user) return { error: "This account no longer exists." } as const;
  if (user.role === "MASTER_ADMIN") return { error: "The Master Admin account can't be modified." } as const;
  return { user } as const;
}

/** deactivateAdmin (and its undo) — REQ-MTT-001-005. Deactivated staff are blocked at sign-in. */
export async function setAdminActive(userId: string, active: boolean) {
  const master = await requireMaster();
  if (!master.ok) return master.result;
  const found = await modifiableUser(userId, master.admin.id);
  if ("error" in found) return { ok: false, message: found.error };

  // Ban in Supabase Auth too, so an existing session can't be refreshed.
  const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
    ban_duration: active ? "none" : "876000h",
  });
  if (error) {
    console.error("Updating auth ban failed", error);
    return { ok: false, message: "We couldn't update the account. Please try again." };
  }
  await prisma.user.update({ where: { id: userId }, data: { isActive: active, failedAttempts: 0, lockedUntil: null } });
  await logAudit({
    userId: master.admin.id,
    action: active ? "REACTIVATE_ADMIN" : "DEACTIVATE_ADMIN",
    target: `users:${userId}`,
    detail: { name: found.user.name, email: found.user.email },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

/**
 * deleteAdmin — REQ-MTT-001-005. Content they created stays on the site; it
 * just no longer shows who made it. The audit log keeps their name.
 */
export async function deleteAdmin(userId: string) {
  const master = await requireMaster();
  if (!master.ok) return master.result;
  const found = await modifiableUser(userId, master.admin.id);
  if ("error" in found) return { ok: false, message: found.error };

  await prisma.$transaction([
    prisma.package.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
    prisma.galleryImage.updateMany({ where: { uploadedById: userId }, data: { uploadedById: null } }),
    prisma.testimonial.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
    prisma.siteConfig.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),
    prisma.announcement.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
    prisma.auditLog.updateMany({ where: { userId }, data: { userId: null } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) console.error("Deleting auth user failed (account row already removed)", error);

  await logAudit({
    userId: master.admin.id,
    action: "DELETE_ADMIN",
    target: `users:${userId}`,
    detail: { name: found.user.name, email: found.user.email },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

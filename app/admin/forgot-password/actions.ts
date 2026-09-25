"use server";

import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { sendPasswordResetEmail } from "@/lib/email";
import { RESET_HOURS, issuePasswordToken, setPasswordUrl } from "@/lib/password-tokens";
import { prisma } from "@/lib/prisma";
import { requestOrigin } from "@/lib/request-origin";

export type ForgotState = { status: "idle" } | { status: "sent"; email: string } | { status: "error"; message: string };

/**
 * Emails a 1-hour reset link. Always answers the same way, so the form can't
 * be used to discover which emails have admin accounts.
 */
export async function requestPasswordReset(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { status: "error", message: "Please enter a valid email address." };
  const email = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, isActive: true, joinedAt: true, passwordTokenExpiresAt: true },
  });

  // Only active admins who've finished setup. Skip if a link went out in the
  // last 2 minutes, to stop the form being used to flood an inbox.
  const recentlySent =
    user?.passwordTokenExpiresAt &&
    user.passwordTokenExpiresAt.getTime() - Date.now() > (RESET_HOURS * 60 - 2) * 60_000;

  if (user?.isActive && user.joinedAt && !recentlySent) {
    const token = await issuePasswordToken(user.id, RESET_HOURS);
    const sent = await sendPasswordResetEmail(email, user.name, setPasswordUrl(await requestOrigin(), token));
    await logAudit({ userId: user.id, action: "REQUEST_PASSWORD_RESET", target: `users:${user.id}`, detail: { emailSent: sent } });
  }

  return { status: "sent", email };
}

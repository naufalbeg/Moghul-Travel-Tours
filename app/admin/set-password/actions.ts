"use server";

import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { findPasswordToken } from "@/lib/password-tokens";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { newPasswordPair } from "@/lib/validation/password";

export type SetPasswordState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: { newPassword?: string; confirmPassword?: string } };

/**
 * Finishes an invitation (REQ-MTT-001-004, SRS step 13) or a password reset:
 * checks the one-time link, sets the password, then signs the person in.
 */
export async function setPasswordWithToken(
  token: string,
  _prev: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const found = await findPasswordToken(token);
  if (found.status !== "valid") {
    return { status: "error", message: "This link has expired or was already used. Please ask for a new one." };
  }
  const { user } = found;

  const parsed = newPasswordPair.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: { newPassword?: string; confirmPassword?: string } = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  const { error } = await createAdminClient().auth.admin.updateUserById(user.id, {
    password: parsed.data.newPassword,
  });
  if (error) {
    console.error("Setting password failed", error);
    return {
      status: "error",
      message: error.code === "weak_password" ? "That password is too weak. Try a longer one." : "We couldn't save your password. Please try again.",
    };
  }

  const isInvite = user.joinedAt === null;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      joinedAt: user.joinedAt ?? new Date(),
      passwordTokenHash: null,
      passwordTokenExpiresAt: null,
      failedAttempts: 0,
      lockedUntil: null,
    },
  });
  await logAudit({ userId: user.id, action: isInvite ? "ACCEPT_INVITE" : "RESET_PASSWORD", target: `users:${user.id}` });

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.newPassword,
  });
  redirect(signInError ? "/admin/login" : "/admin");
}

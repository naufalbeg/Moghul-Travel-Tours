"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export type LoginState =
  | { status: "idle"; email?: string }
  | { status: "error"; email: string; message: string; detail?: string }
  | { status: "locked"; email: string; message: string; detail: string };

const credentials = z.object({
  email: z.email().transform((e) => e.trim().toLowerCase()),
  password: z.string().min(1),
});

function lockedState(email: string, lockedUntil: Date): LoginState {
  const minutes = Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000));
  return {
    status: "locked",
    email,
    message: "Account temporarily locked.",
    detail: `Too many failed sign-in attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
  };
}

/** AuthController.signInWithPassword — REQ-MTT-001-001 and lockout REQ-MTT-001-006. */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = String(formData.get("email") ?? "");
  const parsed = credentials.safeParse({ email: rawEmail, password: formData.get("password") });
  if (!parsed.success) {
    return {
      status: "error",
      email: rawEmail,
      message: "Please enter a valid email address and your password.",
    };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    return lockedState(email, user.lockedUntil);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "user_banned") {
      return {
        status: "error",
        email,
        message: "This account has been deactivated.",
        detail: "Please contact your Master Admin if you think this is a mistake.",
      };
    }
    if (error.code !== "invalid_credentials") {
      console.error("Sign-in failed", error);
      return {
        status: "error",
        email,
        message: "We couldn't sign you in right now. Please try again in a moment.",
      };
    }

    // Unknown email: nothing to count against.
    if (!user) return { status: "error", email, message: "Invalid email or password. Please try again." };

    const { failedAttempts } = await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: { increment: 1 } },
      select: { failedAttempts: true },
    });

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60_000);
      await prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockedUntil },
      });
      await logAudit({ userId: user.id, action: "ACCOUNT_LOCKED", target: `users:${user.id}` });
      return lockedState(email, lockedUntil);
    }

    const remaining = MAX_FAILED_ATTEMPTS - failedAttempts;
    return {
      status: "error",
      email,
      message: "Invalid email or password. Please try again.",
      detail: `${remaining} attempt${remaining === 1 ? "" : "s"} remaining before your account is temporarily locked.`,
    };
  }

  // Correct password, but the account must also be a known, active admin.
  if (!user || !user.isActive) {
    await supabase.auth.signOut();
    return {
      status: "error",
      email,
      message: user
        ? "This account has been deactivated."
        : "This account doesn't have access to the admin dashboard.",
      detail: "Please contact your Master Admin if you think this is a mistake.",
    };
  }

  if (user.failedAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }

  redirect("/admin");
}

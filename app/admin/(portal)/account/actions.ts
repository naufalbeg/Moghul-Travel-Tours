"use server";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { getCurrentAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { newPassword } from "@/lib/validation/password";

export type ChangePasswordState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string>>;
    };

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "The two new passwords don't match.",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from your current one.",
  });

/** Lets any signed-in admin change their own password. */
export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { status: "error", message: "Your session has expired. Please sign in again." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: NonNullable<Extract<ChangePasswordState, { status: "error" }>["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof typeof fieldErrors;
      fieldErrors[field] ??= issue.message;
    }
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }
  const { currentPassword, newPassword } = parsed.data;

  // Confirm the current password with a throwaway client, so the admin's own
  // session cookies are left untouched.
  const verifier = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: admin.email,
    password: currentPassword,
  });
  if (verifyError) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: { currentPassword: "That's not your current password." },
    };
  }
  await verifier.auth.signOut({ scope: "local" });

  const { error } = await createAdminClient().auth.admin.updateUserById(admin.id, {
    password: newPassword,
  });
  if (error) {
    console.error("Password update failed", error);
    return {
      status: "error",
      message:
        error.code === "weak_password"
          ? "That password is too weak. Try a longer one."
          : "We couldn't update your password. Please try again.",
    };
  }

  await logAudit({ userId: admin.id, action: "CHANGE_PASSWORD", target: `users:${admin.id}` });
  return { status: "success" };
}

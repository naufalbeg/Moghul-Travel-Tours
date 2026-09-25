import { z } from "zod";

// SRS 3.1 rule: min. 8 characters, at least one number and one special
// character. Shared by change-password, set-password (invites) and reset.

export const PASSWORD_HINT = "At least 8 characters, with a number and a special character (e.g. ! @ # $).";

export const newPassword = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.")
  .regex(/\d/, "Include at least one number.")
  .regex(/[^A-Za-z0-9]/, "Include at least one special character, e.g. ! @ # $.");

/** New password + confirmation, with a matching check. */
export const newPasswordPair = z
  .object({ newPassword, confirmPassword: z.string() })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "The two passwords don't match.",
  });

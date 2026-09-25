import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/admin/auth-card";
import { findPasswordToken } from "@/lib/password-tokens";
import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = { title: "Set your password" };

/**
 * Where invitation and password-reset links land. Shows the SRS A1 expiry
 * notice when the link has lapsed.
 */
export default async function SetPasswordPage({ searchParams }: PageProps<"/admin/set-password">) {
  const tokenParam = (await searchParams).token;
  const token = typeof tokenParam === "string" ? tokenParam : undefined;
  const found = await findPasswordToken(token);

  if (found.status !== "valid") {
    const isInvite = found.status === "expired" && found.user.joinedAt === null;
    return (
      <AuthCard title={found.status === "expired" ? "This link has expired" : "This link isn't valid"}>
        <p className="mb-6 text-center text-[15px] text-muted">
          {isInvite
            ? "Invitation links last 24 hours. Please ask your Master Admin to send you a new invitation."
            : "The link may have expired or already been used. You can request a new one below."}
        </p>
        <div className="flex flex-col gap-3">
          {!isInvite && (
            <Link
              href="/admin/forgot-password"
              className="flex min-h-12 items-center justify-center rounded-lg bg-accent font-bold text-white"
            >
              Send me a new link
            </Link>
          )}
          <Link
            href="/admin/login"
            className="flex min-h-12 items-center justify-center rounded-lg border-[1.5px] border-line font-semibold"
          >
            Go to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  const isInvite = found.user.joinedAt === null;
  return (
    <AuthCard
      title={isInvite ? `Welcome, ${found.user.name.split(" ")[0]}` : "Choose a new password"}
      subtitle={
        isInvite
          ? `Choose a password for ${found.user.email} to finish setting up your account.`
          : `For ${found.user.email}`
      }
    >
      <SetPasswordForm token={token!} submitLabel={isInvite ? "Set password & sign in" : "Save password & sign in"} />
    </AuthCard>
  );
}

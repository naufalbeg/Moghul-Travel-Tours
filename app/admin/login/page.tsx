import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/auth-card";
import { getCurrentAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

/** LoginPage [PKG-MTT-001-001] — mockups 3.1.4 and 3.1.8. */
export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");

  return (
    <AuthCard title="Sign in to your dashboard" subtitle="Enter your credentials to continue.">
      <LoginForm />
      <p className="mt-6 text-center text-sm leading-relaxed text-muted">
        New staff account? Ask your Master Admin to send you an invite.
      </p>
    </AuthCard>
  );
}

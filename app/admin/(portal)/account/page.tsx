import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "My account" };

const roleLabel = { MASTER_ADMIN: "Master Admin", ADMIN: "Admin" } as const;

export default async function AccountPage() {
  const admin = await requireAdmin();

  return (
    <div className="max-w-[640px] space-y-6">
      <div>
        <h2 className="mb-1 text-[23px]">My account</h2>
        <p className="text-muted">Your sign-in details for the admin dashboard.</p>
      </div>

      <section className="rounded-xl border border-line bg-white px-6 py-6 sm:px-8">
        <h3 className="mb-4 text-[17px]">Profile</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
          <dt className="text-muted">Name</dt>
          <dd className="font-semibold">{admin.name}</dd>
          <dt className="text-muted">Email</dt>
          <dd className="font-semibold break-all">{admin.email}</dd>
          <dt className="text-muted">Role</dt>
          <dd className="font-semibold">{roleLabel[admin.role]}</dd>
        </dl>
      </section>

      <section className="rounded-xl border border-line bg-white px-6 py-6 sm:px-8">
        <h3 className="mb-1 text-[17px]">Change password</h3>
        <p className="mb-5 text-sm text-muted">
          You&apos;ll stay signed in on this device after changing it.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}

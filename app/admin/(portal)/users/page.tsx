import type { Metadata } from "next";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { PageHeader } from "@/components/admin/field";
import { AddAdminButton, ResendInviteButton } from "@/components/admin/invite-dialogs";
import { TrashIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth";
import { formatDate, initials } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { deleteAdmin, setAdminActive } from "./actions";

export const metadata: Metadata = { title: "User management" };

const pill = "inline-block rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap";

/** UserManagementPage [PKG-MTT-001-003] — mockup 3.1.6. Master Admin only. */
export default async function UsersPage() {
  const me = await requireAdmin("MASTER_ADMIN");
  const now = new Date();
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      joinedAt: true,
      createdAt: true,
      passwordTokenExpiresAt: true,
    },
  });

  return (
    <>
      <PageHeader title="Admin accounts" subtitle="Manage who has access to the admin dashboard." action={<AddAdminButton />} />

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-canvas text-[13px] font-bold tracking-wide text-muted">
              <th scope="col" className="px-5 py-4">Name</th>
              <th scope="col" className="px-5 py-4">Role</th>
              <th scope="col" className="px-5 py-4">Status</th>
              <th scope="col" className="px-5 py-4">Joined</th>
              <th scope="col" className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => {
              const isMaster = u.role === "MASTER_ADMIN";
              const pending = u.joinedAt === null;
              const inviteLive = pending && u.passwordTokenExpiresAt !== null && u.passwordTokenExpiresAt > now;
              const hoursLeft = inviteLive ? Math.ceil((u.passwordTokenExpiresAt!.getTime() - now.getTime()) / 3_600_000) : 0;
              const muted = !u.isActive;

              const status = !u.isActive
                ? { label: "Deactivated", className: "bg-line text-muted" }
                : pending
                  ? inviteLive
                    ? { label: `Invited · ${hoursLeft}h left`, className: "bg-primary-pale text-primary" }
                    : { label: "Invite expired", className: "bg-accent-pale text-accent-dark" }
                  : { label: "Active", className: "bg-success-pale text-success" };

              return (
                <tr key={u.id} className={muted ? "bg-[#fafbfc]" : undefined}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex size-[38px] shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold ${
                          muted ? "bg-line text-muted" : "bg-primary-pale text-primary"
                        }`}
                      >
                        {initials(u.name)}
                      </span>
                      <div>
                        <div className={`font-semibold ${muted ? "text-muted" : ""}`}>
                          {u.name}
                          {u.id === me.id && (
                            <span className="ml-2 rounded-full bg-primary-pale px-2 py-px align-middle text-[11px] font-bold text-primary">You</span>
                          )}
                        </div>
                        <div className="text-sm text-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`px-5 py-4 text-sm font-semibold ${isMaster ? "text-accent-dark" : ""}`}>
                    {isMaster ? "Master Admin" : "Admin"}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`${pill} ${status.className}`}>{status.label}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted">
                    {isMaster ? "Founder" : u.joinedAt ? formatDate(u.joinedAt) : "Not yet"}
                  </td>
                  <td className="px-5 py-4">
                    {isMaster || u.id === me.id ? (
                      <span className="text-[13.5px] text-muted italic">Cannot be modified</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {pending && u.isActive && <ResendInviteButton userId={u.id} />}
                        {!pending && u.isActive && (
                          <ConfirmActionButton
                            label="Deactivate"
                            tone="neutral"
                            title={`Deactivate ${u.name}?`}
                            confirmLabel="Deactivate"
                            action={setAdminActive.bind(null, u.id, false)}
                          >
                            They&apos;ll be signed out and can&apos;t sign in again until you reactivate them. Nothing
                            they created is removed.
                          </ConfirmActionButton>
                        )}
                        {!u.isActive && (
                          <ConfirmActionButton
                            label="Reactivate"
                            tone="neutral"
                            title={`Reactivate ${u.name}?`}
                            confirmLabel="Reactivate"
                            action={setAdminActive.bind(null, u.id, true)}
                          >
                            They&apos;ll be able to sign in again with their existing password.
                          </ConfirmActionButton>
                        )}
                        <ConfirmActionButton
                          label={pending ? "Cancel invite" : "Delete"}
                          icon={<TrashIcon className="size-3.5" />}
                          title={pending ? `Cancel the invitation for ${u.name}?` : `Delete ${u.name}'s account?`}
                          confirmLabel={pending ? "Cancel invitation" : "Delete account"}
                          action={deleteAdmin.bind(null, u.id)}
                        >
                          {pending
                            ? "Their invitation link will stop working."
                            : "They'll lose access permanently. Packages, photos and other content they added stay on the website."}
                        </ConfirmActionButton>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

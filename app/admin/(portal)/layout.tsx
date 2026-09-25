import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Everything under /admin except /admin/login. Each page must still call
// requireAdmin() itself — layouts don't re-run on client navigation.
export default async function PortalLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const newInquiries = await prisma.inquiry.count({ where: { status: "NEW" } });
  return (
    <AdminShell admin={admin} newInquiries={newInquiries}>
      {children}
    </AdminShell>
  );
}

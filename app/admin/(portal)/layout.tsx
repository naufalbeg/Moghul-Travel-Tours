import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";

// Everything under /admin except /admin/login. Each page must still call
// requireAdmin() itself — layouts don't re-run on client navigation.
export default async function PortalLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return <AdminShell admin={admin}>{children}</AdminShell>;
}

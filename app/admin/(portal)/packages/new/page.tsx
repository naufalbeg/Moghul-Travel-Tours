import type { Metadata } from "next";
import { PackageForm } from "@/components/admin/package-form";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Add new package" };

export default async function NewPackagePage() {
  await requireAdmin();
  return <PackageForm packageId={null} initial={null} isPublished={false} />;
}

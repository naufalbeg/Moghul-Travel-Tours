import type { Metadata } from "next";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Post announcement" };

export default async function NewAnnouncementPage() {
  await requireAdmin();
  return <AnnouncementForm id={null} initial={null} />;
}

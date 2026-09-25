import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { malaysianDate } from "@/lib/validation/announcement";

export const metadata: Metadata = { title: "Edit announcement" };

export default async function EditAnnouncementPage({ params }: PageProps<"/admin/announcements/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const a = await prisma.announcement.findUnique({ where: { id } });
  if (!a) notFound();

  return (
    <AnnouncementForm
      id={a.id}
      initial={{ title: a.title, body: a.body, expiresOn: a.expiresAt ? malaysianDate(a.expiresAt) : "" }}
    />
  );
}

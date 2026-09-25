import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { TestimonialForm } from "@/components/admin/testimonial-form";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit testimonial" };

export default async function EditTestimonialPage({ params }: PageProps<"/admin/testimonials/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const t = await prisma.testimonial.findUnique({ where: { id } });
  if (!t) notFound();

  return (
    <TestimonialForm
      id={t.id}
      initial={{
        customerName: t.customerName,
        tripName: t.tripName,
        reviewText: t.reviewText,
        starRating: t.starRating,
        tripDate: t.tripDate ? t.tripDate.toISOString().slice(0, 10) : "",
      }}
    />
  );
}

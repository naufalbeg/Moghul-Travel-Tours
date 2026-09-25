"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateTestimonial, type TestimonialErrors, type TestimonialInput } from "@/lib/validation/testimonial";

// TestimonialController (SDD 4.2.5). Testimonials are hard-deleted.

export type SaveTestimonialFailure = { ok: false; message: string; errors?: TestimonialErrors };

/** createTestimonial / updateTestimonial — REQ-MTT-005-001, 004. */
export async function saveTestimonial(id: string | null, input: TestimonialInput): Promise<SaveTestimonialFailure> {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return { ok: false, message: "Your session has expired. Please sign in again." };
  if (id !== null && !z.uuid().safeParse(id).success) return { ok: false, message: "Unknown testimonial." };

  const result = validateTestimonial(input);
  if (!result.ok) {
    const count = Object.keys(result.errors).length;
    return { ok: false, message: `Please fix ${count} error${count === 1 ? "" : "s"} before saving.`, errors: result.errors };
  }
  const { tripDate, ...fields } = result.values;
  const data = { ...fields, tripDate: tripDate ? new Date(`${tripDate}T00:00:00Z`) : null };

  let saved;
  if (id) {
    const exists = await prisma.testimonial.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return { ok: false, message: "This testimonial no longer exists." };
    saved = await prisma.testimonial.update({ where: { id }, data });
  } else {
    saved = await prisma.testimonial.create({ data: { ...data, createdById: auth.admin.id } });
  }

  await logAudit({
    userId: auth.admin.id,
    action: id ? "UPDATE_TESTIMONIAL" : "CREATE_TESTIMONIAL",
    target: `testimonials:${saved.id}`,
    detail: { customerName: saved.customerName },
  });
  revalidatePath("/admin/testimonials");
  redirect(`/admin/testimonials?saved=${encodeURIComponent(saved.customerName)}`);
}

/** deleteTestimonial — REQ-MTT-005-005 (after the confirmation dialog). */
export async function deleteTestimonial(id: string) {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return { ok: false, message: "Your session has expired. Please sign in again." };
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Unknown testimonial." };

  const existing = await prisma.testimonial.findUnique({ where: { id }, select: { customerName: true } });
  if (!existing) return { ok: false, message: "This testimonial was already deleted." };

  await prisma.testimonial.delete({ where: { id } });
  await logAudit({
    userId: auth.admin.id,
    action: "DELETE_TESTIMONIAL",
    target: `testimonials:${id}`,
    detail: { customerName: existing.customerName },
  });
  revalidatePath("/admin/testimonials");
  return { ok: true };
}

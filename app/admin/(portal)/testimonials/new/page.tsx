import type { Metadata } from "next";
import { TestimonialForm } from "@/components/admin/testimonial-form";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Add testimonial" };

export default async function NewTestimonialPage() {
  await requireAdmin();
  return <TestimonialForm id={null} initial={null} />;
}

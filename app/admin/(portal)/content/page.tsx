import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSiteContent } from "@/lib/site-config";
import { ContentEditor } from "./content-editor";

export const metadata: Metadata = { title: "Content pages" };

export default async function ContentPage() {
  await requireAdmin();
  const content = await getSiteContent();
  return <ContentEditor initial={content} />;
}

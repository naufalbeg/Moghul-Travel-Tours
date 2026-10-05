import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PackageForm, type PackageFormState } from "@/components/admin/package-form";
import { requireAdmin } from "@/lib/auth";
import { buildPriceList } from "@/lib/package-prices";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit package" };

export default async function EditPackagePage({ params }: PageProps<"/admin/packages/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const pkg = await prisma.package.findFirst({
    where: { id, deletedAt: null },
    include: {
      itinerary: { orderBy: [{ sortOrder: "asc" }, { dayStart: "asc" }] },
      departures: { orderBy: { departureDate: "asc" } },
      images: { orderBy: [{ sortOrder: "asc" }] },
      prices: true,
    },
  });
  if (!pkg) notFound();

  const priceOf = (type: string) => pkg.prices.find((p) => p.type === type)?.amount.toString() ?? "";
  const initial: PackageFormState = {
    title: pkg.title,
    slug: pkg.slug,
    category: pkg.category,
    description: pkg.description,
    highlights: pkg.highlights.join("\n"),
    inclusions: pkg.inclusions.join("\n"),
    exclusions: pkg.exclusions.join("\n"),
    durationDays: pkg.durationDays?.toString() ?? "",
    durationNights: pkg.durationNights?.toString() ?? "",
    prices: buildPriceList(priceOf),
    availability: pkg.availability,
    itinerary: pkg.itinerary.map((d) => ({
      key: d.id,
      dayStart: String(d.dayStart),
      dayEnd: d.dayEnd?.toString() ?? "",
      title: d.title,
      description: d.description,
    })),
    departures: pkg.departures.map((d) => ({
      key: d.id,
      date: d.departureDate.toISOString().slice(0, 10),
      availability: d.availability,
    })),
    images: pkg.images.map((img) => ({
      key: img.id,
      storagePath: img.storagePath,
      url: img.url,
      isPrimary: img.isPrimary,
      status: "done" as const,
    })),
  };

  return <PackageForm packageId={pkg.id} initial={initial} isPublished={pkg.status === "PUBLISHED"} />;
}

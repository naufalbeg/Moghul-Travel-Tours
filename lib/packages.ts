import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import type { PackageCategory, Prisma } from "@/generated/prisma/client";
import { todayInMalaysia } from "@/lib/format";
import { prisma } from "@/lib/prisma";

// Public read side of PackageController (SDD 4.2.2): only published,
// non-deleted packages are ever visible to visitors.
const PUBLIC: Prisma.PackageWhereInput = { status: "PUBLISHED", deletedAt: null };

const primaryImageFirst: Prisma.PackageImageOrderByWithRelationInput[] = [
  { isPrimary: "desc" },
  { sortOrder: "asc" },
];

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  highlights: true,
  pricePerPax: true,
  availability: true,
  durationDays: true,
  images: { orderBy: primaryImageFirst, take: 1, select: { url: true } },
} satisfies Prisma.PackageSelect;

export type PackageCardData = {
  id: string;
  slug: string;
  title: string;
  category: PackageCategory;
  highlights: string[];
  price: number;
  availability: Prisma.PackageGetPayload<{ select: typeof cardSelect }>["availability"];
  durationDays: number | null;
  imageUrl: string | null;
};

function toCard(p: Prisma.PackageGetPayload<{ select: typeof cardSelect }>): PackageCardData {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    highlights: p.highlights,
    price: Number(p.pricePerPax),
    availability: p.availability,
    durationDays: p.durationDays,
    imageUrl: p.images[0]?.url ?? null,
  };
}

/** "2027-03" → [1 Mar 2027, 1 Apr 2027) as UTC dates, or null if malformed. */
function monthRange(month: string | undefined) {
  const match = month?.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const [year, m] = [Number(match[1]), Number(match[2])];
  if (m < 1 || m > 12) return null;
  return { gte: new Date(Date.UTC(year, m - 1, 1)), lt: new Date(Date.UTC(year, m, 1)) };
}

/** listPublishedPackages — REQ-MTT-002-004. Newest first. */
export async function listPublishedPackages(filters: {
  categories?: readonly PackageCategory[];
  query?: string;
  month?: string;
  take?: number;
} = {}) {
  await connection(); // always read fresh data, never prerender

  const query = filters.query?.trim();
  const range = monthRange(filters.month);
  const today = todayInMalaysia();

  const where: Prisma.PackageWhereInput = {
    ...PUBLIC,
    ...(filters.categories && { category: { in: [...filters.categories] } }),
    ...(query && {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    }),
    ...(range && {
      departures: {
        some: { departureDate: { gte: range.gte > today ? range.gte : today, lt: range.lt } },
      },
    }),
  };

  const rows = await prisma.package.findMany({
    where,
    select: cardSelect,
    orderBy: { createdAt: "desc" },
    take: filters.take,
  });
  return rows.map(toCard);
}

/**
 * getPackageById (by slug) — REQ-MTT-002-005. Upcoming departures only.
 * Cached per request so the page and its metadata share one query.
 */
export const getPublishedPackage = cache(async (slug: string) => {
  await connection();

  const pkg = await prisma.package.findFirst({
    where: { ...PUBLIC, slug },
    include: {
      images: { orderBy: primaryImageFirst, select: { id: true, url: true } },
      itinerary: { orderBy: [{ sortOrder: "asc" }, { dayStart: "asc" }] },
      departures: {
        where: { departureDate: { gte: todayInMalaysia() } },
        orderBy: { departureDate: "asc" },
      },
    },
  });
  if (!pkg) return null;

  const { pricePerPax, ...rest } = pkg;
  return { ...rest, price: Number(pricePerPax) };
});

/**
 * Next 12 months as { value: "2027-03", label: "March 2027" } for the
 * homepage "Month" search field.
 */
export function upcomingMonths(count = 12) {
  const today = todayInMalaysia();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + i, 1));
    return {
      value: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
    };
  });
}

/** Published packages as { slug, title } for the inquiry form dropdown. */
export async function listPackageOptions() {
  await connection();
  return prisma.package.findMany({
    where: PUBLIC,
    orderBy: { title: "asc" },
    select: { slug: true, title: true },
  });
}

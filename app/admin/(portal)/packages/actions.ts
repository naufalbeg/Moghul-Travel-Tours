"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  IMAGE_EXTENSION,
  IMAGE_MAX_BYTES,
  MAX_PACKAGE_IMAGES,
  isAllowedImageType,
  publicImageUrl,
} from "@/lib/storage-config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PACKAGE_BUCKET,
  slugify,
  validatePackage,
  type FieldErrors,
  type PackageInput,
  type SaveIntent,
} from "@/lib/validation/package";

// Write side of PackageController (SDD 4.2.2). Every action re-checks auth —
// server actions are public HTTP endpoints, whatever the UI shows.

export type ActionFailure = { ok: false; message: string; errors?: FieldErrors };

async function requireAdminOrFail() {
  const auth = await authorize("ADMIN");
  return auth.ok ? auth.admin : null;
}

/**
 * Step 1 of an image upload: validates the files and returns one-time signed
 * upload URLs. The browser then uploads straight to Supabase Storage, so the
 * image bytes never pass through our server (SDD: direct-to-Storage upload).
 */
export async function createPackageImageUploads(files: { type: string; size: number }[]) {
  const admin = await requireAdminOrFail();
  if (!admin) return { ok: false, message: "Your session has expired. Please sign in again." } as ActionFailure;

  if (files.length === 0 || files.length > MAX_PACKAGE_IMAGES) {
    return { ok: false, message: `Choose between 1 and ${MAX_PACKAGE_IMAGES} images.` } as ActionFailure;
  }
  for (const file of files) {
    if (!isAllowedImageType(file.type)) {
      return { ok: false, message: "Only JPG, PNG or WEBP images can be uploaded." } as ActionFailure;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      return { ok: false, message: "Each image must be 5MB or smaller." } as ActionFailure;
    }
  }

  const storage = createAdminClient().storage.from(PACKAGE_BUCKET);
  const uploads = [];
  for (const file of files) {
    const path = `${randomUUID()}.${IMAGE_EXTENSION[file.type as keyof typeof IMAGE_EXTENSION]}`;
    const { data, error } = await storage.createSignedUploadUrl(path);
    if (error) {
      console.error("createSignedUploadUrl failed", error);
      return { ok: false, message: "Couldn't prepare the upload. Please try again." } as ActionFailure;
    }
    uploads.push({ path: data.path, token: data.token, url: publicImageUrl(PACKAGE_BUCKET, data.path) });
  }
  return { ok: true as const, uploads };
}

async function uniqueSlug(base: string, excludeId: string | null) {
  const root = base || "package";
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const clash = await prisma.package.findFirst({
      where: { slug: candidate, ...(excludeId && { id: { not: excludeId } }) },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
}

/**
 * createPackage / updatePackage — REQ-MTT-002-001/002/006. "draft" saves
 * (and unpublishes); "publish" requires the full set of fields.
 */
export async function savePackage(
  id: string | null,
  input: PackageInput,
  intent: SaveIntent,
): Promise<ActionFailure> {
  const admin = await requireAdminOrFail();
  if (!admin) return { ok: false, message: "Your session has expired. Please sign in again." };
  if (id !== null && !z.uuid().safeParse(id).success) return { ok: false, message: "Unknown package." };

  const result = validatePackage(input, intent);
  if (!result.ok) {
    const count = Object.keys(result.errors).length;
    return {
      ok: false,
      message: `Please fix ${count} error${count === 1 ? "" : "s"} before ${intent === "publish" ? "publishing" : "saving"}.`,
      errors: result.errors,
    };
  }
  const v = result.values;

  const existing = id
    ? await prisma.package.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, status: true, images: { select: { storagePath: true } } },
      })
    : null;
  if (id && !existing) return { ok: false, message: "This package no longer exists." };

  // Slug: an explicit one must be free; an automatic one gets a -2, -3… suffix.
  let slug: string;
  if (v.slug) {
    const clash = await prisma.package.findFirst({
      where: { slug: v.slug, ...(id && { id: { not: id } }) },
      select: { id: true },
    });
    if (clash) {
      return {
        ok: false,
        message: "Please fix 1 error before saving.",
        errors: { slug: "Another package already uses this web address." },
      };
    }
    slug = v.slug;
  } else {
    slug = await uniqueSlug(slugify(v.title), id);
  }

  const primaryIndex = Math.max(0, v.images.findIndex((img) => img.isPrimary));
  const data = {
    slug,
    title: v.title,
    category: v.category,
    description: v.description,
    highlights: v.highlights,
    inclusions: v.inclusions,
    durationDays: v.durationDays,
    durationNights: v.durationNights,
    roomSharing: v.roomSharing || null,
    pricePerPax: v.price ?? 0,
    availability: v.availability,
    status: intent === "publish" ? ("PUBLISHED" as const) : ("DRAFT" as const),
  };
  const children = {
    itinerary: {
      create: v.itinerary.map((day, i) => ({ ...day, dayEnd: day.dayEnd === day.dayStart ? null : day.dayEnd, sortOrder: i })),
    },
    departures: {
      create: v.departures.map((d) => ({
        departureDate: new Date(`${d.date}T00:00:00Z`),
        availability: d.availability,
      })),
    },
    images: {
      create: v.images.map((img, i) => ({
        storagePath: img.storagePath,
        url: publicImageUrl(PACKAGE_BUCKET, img.storagePath),
        isPrimary: i === primaryIndex,
        sortOrder: i,
      })),
    },
  };

  const saved = existing
    ? await prisma.$transaction(async (tx) => {
        // Child rows are replaced wholesale — simpler than diffing, and the
        // form always submits the complete list.
        await tx.packageItineraryDay.deleteMany({ where: { packageId: existing.id } });
        await tx.packageDeparture.deleteMany({ where: { packageId: existing.id } });
        await tx.packageImage.deleteMany({ where: { packageId: existing.id } });
        return tx.package.update({ where: { id: existing.id }, data: { ...data, ...children } });
      })
    : await prisma.package.create({ data: { ...data, ...children, createdById: admin.id } });

  // Photos removed in this edit are deleted from Storage too.
  if (existing) {
    const kept = new Set(v.images.map((img) => img.storagePath));
    const removed = existing.images.map((img) => img.storagePath).filter((p) => !kept.has(p));
    if (removed.length > 0) {
      const { error } = await createAdminClient().storage.from(PACKAGE_BUCKET).remove(removed);
      if (error) console.error("Failed to delete removed package images", error);
    }
  }

  const action = !existing
    ? "CREATE_PACKAGE"
    : existing.status !== saved.status
      ? saved.status === "PUBLISHED"
        ? "PUBLISH_PACKAGE"
        : "UNPUBLISH_PACKAGE"
      : "UPDATE_PACKAGE";
  await logAudit({
    userId: admin.id,
    action,
    target: `packages:${saved.id}`,
    detail: { title: saved.title, status: saved.status },
  });

  revalidatePath("/admin/packages");
  const notice = saved.status === "PUBLISHED" ? "published" : "saved";
  redirect(`/admin/packages?${notice}=${encodeURIComponent(saved.title)}`);
}

/** deletePackage — REQ-MTT-002-007. Soft delete: hidden everywhere, row kept for audit. */
export async function deletePackage(id: string): Promise<{ ok: boolean; message?: string }> {
  const admin = await requireAdminOrFail();
  if (!admin) return { ok: false, message: "Your session has expired. Please sign in again." };
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Unknown package." };

  const pkg = await prisma.package.findFirst({ where: { id, deletedAt: null }, select: { title: true } });
  if (!pkg) return { ok: false, message: "This package was already deleted." };

  await prisma.package.update({ where: { id }, data: { deletedAt: new Date(), status: "DRAFT" } });
  await logAudit({ userId: admin.id, action: "DELETE_PACKAGE", target: `packages:${id}`, detail: { title: pkg.title } });

  revalidatePath("/admin/packages");
  return { ok: true };
}

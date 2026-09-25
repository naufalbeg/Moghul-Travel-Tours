"use server";

import { logAudit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_CONTENT_DEFAULTS, SITE_CONTENT_KEYS, type SiteContent } from "@/lib/site-content";
import { validateSiteContent, type ContentErrors } from "@/lib/validation/site-content";

export type SaveContentResult =
  | { ok: true; values: SiteContent; changed: number }
  | { ok: false; message: string; errors?: ContentErrors };

/**
 * ContentController.updateContent (SDD 4.2.6) — REQ-MTT-006-002…007.
 * Validates, then writes only the changed keys in one transaction.
 */
export async function updateSiteContent(input: SiteContent): Promise<SaveContentResult> {
  const auth = await authorize("ADMIN");
  if (!auth.ok) return { ok: false, message: "Your session has expired. Please sign in again." };

  const result = validateSiteContent(input);
  if (!result.ok) {
    const count = Object.keys(result.errors).length;
    return {
      ok: false,
      message: `Please fix ${count} error${count === 1 ? "" : "s"} before saving.`,
      errors: result.errors,
    };
  }
  const values = result.values as SiteContent;

  const rows = await prisma.siteConfig.findMany({ where: { key: { in: SITE_CONTENT_KEYS } } });
  const current: SiteContent = { ...SITE_CONTENT_DEFAULTS };
  for (const row of rows) current[row.key as keyof SiteContent] = row.value;

  const changed = SITE_CONTENT_KEYS.filter((key) => values[key] !== current[key]);
  if (changed.length > 0) {
    await prisma.$transaction(
      changed.map((key) =>
        prisma.siteConfig.upsert({
          where: { key },
          create: { key, value: values[key], updatedById: auth.admin.id },
          update: { value: values[key], updatedById: auth.admin.id },
        }),
      ),
    );
    await logAudit({
      userId: auth.admin.id,
      action: "UPDATE_CONTENT",
      target: "site_config",
      detail: { changed, before: Object.fromEntries(changed.map((k) => [k, current[k]])) },
    });
  }

  return { ok: true, values, changed: changed.length };
}

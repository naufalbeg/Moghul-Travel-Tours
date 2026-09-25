import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Records an admin action in audit_log. Never throws — a failed audit write
 * shouldn't undo or block the action it describes.
 */
export async function logAudit(entry: {
  userId: string | null;
  action: string;
  target: string;
  detail?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({ data: entry });
  } catch (error) {
    console.error("Failed to write audit log", entry.action, error);
  }
}

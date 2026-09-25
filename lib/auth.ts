import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

/**
 * The signed-in, active admin for this request, or null. Deduplicated per
 * request, so layouts and pages can both call it freely.
 *
 * A valid Supabase session alone isn't enough: the user must also exist in
 * our users table and not be deactivated.
 */
export const getCurrentAdmin = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
});

const roleRank: Record<UserRole, number> = { ADMIN: 1, MASTER_ADMIN: 2 };

export function hasRole(admin: AdminUser, minRole: UserRole) {
  return roleRank[admin.role] >= roleRank[minRole];
}

/** For admin pages: redirects instead of rendering when not allowed. */
export async function requireAdmin(minRole: UserRole = "ADMIN") {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (!hasRole(admin, minRole)) redirect("/admin");
  return admin;
}

/**
 * For API route handlers (Controllers): returns the admin, or a ready-made
 * 401/403 JSON response.
 *
 *   const auth = await authorize("MASTER_ADMIN");
 *   if (!auth.ok) return auth.response;
 */
export async function authorize(
  minRole: UserRole = "ADMIN",
): Promise<{ ok: true; admin: AdminUser } | { ok: false; response: Response }> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasRole(admin, minRole)) {
    return { ok: false, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, admin };
}

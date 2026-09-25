/**
 * Creates (or repairs) the Master Admin account: a Supabase Auth user plus
 * the matching row in our users table.
 *
 * The password is passed in at run time so it never lands in the repo:
 *
 *   MASTER_ADMIN_EMAIL=... MASTER_ADMIN_NAME="..." MASTER_ADMIN_PASSWORD=... \
 *     npm run create-master-admin
 *
 * Safe to re-run. If the account already exists, its password is reset to
 * MASTER_ADMIN_PASSWORD and it is re-activated and unlocked — which also
 * makes this the recovery path if the Master Admin forgets their password.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../generated/prisma/client";

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
  return value;
}

const email = required("MASTER_ADMIN_EMAIL").trim().toLowerCase();
const name = required("MASTER_ADMIN_NAME").trim();
const password = required("MASTER_ADMIN_PASSWORD");

const supabase = createClient(
  required("NEXT_PUBLIC_SUPABASE_URL"),
  required("SUPABASE_SECRET_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: required("DATABASE_URL"), max: 1 }),
});

async function findAuthUserId(email: string) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) return null;
  }
}

try {
  let userId = await findAuthUserId(email);

  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error) throw error;
    console.log(`Auth user exists — password reset for ${email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Auth user created for ${email}`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    throw new Error(
      `users row for ${email} has id ${existing.id}, but the Auth user is ${userId}. Fix manually.`,
    );
  }

  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email, name, role: "MASTER_ADMIN" },
    update: { name, role: "MASTER_ADMIN", isActive: true, failedAttempts: 0, lockedUntil: null },
  });
  await prisma.auditLog.create({
    data: { userId, action: "SEED_MASTER_ADMIN", target: `users:${userId}` },
  });

  console.log(`Master Admin ready: ${name} <${email}>`);
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "joined_at" TIMESTAMPTZ,
ADD COLUMN     "password_token_expires_at" TIMESTAMPTZ,
ADD COLUMN     "password_token_hash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_password_token_hash_key" ON "users"("password_token_hash");

-- Everyone who already exists has already joined.
UPDATE "users" SET "joined_at" = "created_at" WHERE "joined_at" IS NULL;

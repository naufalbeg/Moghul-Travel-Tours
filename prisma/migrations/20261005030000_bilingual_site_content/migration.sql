-- The public site is now Malay-first (lib/i18n): editable texts are in Malay,
-- with optional English versions under "<key>_en" (lib/site-content.ts).
-- The office hours had been customised in English, so that text becomes the
-- English version and the Malay one says the same hours. Data only — no
-- schema change.

INSERT INTO "site_config" ("key", "value", "updated_by", "updated_at")
SELECT 'office_hours_en', "value", "updated_by", now()
FROM "site_config"
WHERE "key" = 'office_hours'
ON CONFLICT ("key") DO NOTHING;

UPDATE "site_config"
SET "value" = 'Isnin–Jumaat, 9 pagi – 5 petang', "updated_at" = now()
WHERE "key" = 'office_hours' AND "value" = 'Mon–Fri, 9am–5pm';

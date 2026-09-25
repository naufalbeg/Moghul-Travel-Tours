-- Lock the Supabase Data API (PostgREST) out of every app table.
--
-- Prisma creates tables in the "public" schema, which Supabase exposes over
-- its REST API to the anon/authenticated roles using the publishable key that
-- ships in the browser bundle. Without RLS, anyone could read or modify these
-- tables (including users → self-promotion to admin).
--
-- The app never uses the Data API: all reads/writes go through Prisma as the
-- table owner, which bypasses RLS. So: enable RLS with no policies (deny all
-- for API roles) and revoke their privileges as a second layer.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'packages', 'package_images', 'package_itinerary_days',
    'package_departures', 'inquiries', 'gallery_images', 'testimonials',
    'site_config', 'announcements', 'audit_log', '_prisma_migrations'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- Tables created by future migrations shouldn't be exposed by default either.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

@AGENTS.md

# Moghul Travel & Tours — Website Management System

## What this is
A production website for Moghul Travel & Tours Sdn Bhd, a MOTAC-licensed Malaysian
travel agency (Umrah, Ziarah, group tours, domestic packages) based in Shah Alam.
Built by Naufal (UMPSA Software Engineering student) for his father's business,
replacing a static, unmaintainable site at moghultt.com. Full design and
architecture documents exist as SRS-MTT-2026 and SDD-MTT-2026 — treat those as
guidelines for requirements and design, not a strict contract. This is a solo
personal project: deviating from them when it makes the product better is fine
(no need to keep the docs in sync or ask permission for sensible changes, just
mention them). This file is the quick orientation.

Target audience skews older (40s–60s, families, Hajj/Umrah pilgrims, retired
couples) — legibility and simplicity are design requirements, not nice-to-haves.
Body text minimum 17–18px, large touch targets, no auto-advancing carousels,
phone/WhatsApp contact always visible.

## Tech stack (decided, do not deviate without discussion)
- **Language:** TypeScript throughout
- **Framework:** Next.js **16** (installed: 16.3.6), App Router (not Pages Router),
  React 19. This is newer than most training data — read the relevant guide in
  `node_modules/next/dist/docs/` before writing framework code (see AGENTS.md).
- **Styling:** Tailwind CSS **v4** — there is no `tailwind.config.js`; design
  tokens are defined with `@theme` in `app/globals.css`
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma 7 — note the v7-specific syntax:
  - `datasource db { provider = "postgresql" }` — NO `url` line in schema.prisma;
    the URL lives only in `prisma7.config.ts`
  - `generator client { provider = "prisma-client", output = "../generated/prisma" }`
    — NOT the old `prisma-client-js`
  - Config file is named `prisma7.config.ts` (not `prisma.config.ts`) on this
    project specifically, due to an early setup mix-up — CLI commands need
    `--config prisma7.config.ts` explicitly
- **Validation:** Zod v4
- **Auth:** Supabase Auth (email/password, role-based: MASTER_ADMIN / ADMIN)
- **File storage:** Supabase Storage (package images, gallery images)
- **Email:** Resend (inquiry notifications, admin invitations)
- **CAPTCHA:** hCaptcha (public inquiry form only)
- **Hosting:** Vercel
- **Architecture pattern:** Modular Monolith, 3-tier (Presentation / API /
  Data), documented in SDD Section 2

### Supabase key naming (current, as of this project's setup)
Supabase renamed their keys after this project's SDD was written. Use the
CURRENT names, not the SDD's original ANON_KEY/SERVICE_ROLE_KEY terminology:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (replaces the old "anon key")
- `SUPABASE_SECRET_KEY` (replaces the old "service_role key", server-only,
  bypasses RLS)
- `DATABASE_URL` (Prisma connection string)

### Supabase connection pooling — important gotcha already hit once
Use the **Session pooler** (port 5432), not the Transaction pooler (port 6543),
for `DATABASE_URL`. Transaction-mode pooling silently hangs forever on
`prisma migrate dev` (it runs `SET session_replication_role = 'replica'`,
unsupported in transaction mode) — no error, just an infinite hang. This cost
significant debugging time already; don't reintroduce it.

## Environment variables
Already set locally (`.env`, gitignored) and on Vercel (all 3 environments):
`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
**Double-check `NEXT_PUBLIC_SUPABASE_URL` on Vercel is actually the plain
`https://bgomzagmktakkqmkiqdn.supabase.co` URL and not the publishable key's
value** — `vercel env ls` showed an ambiguous truncated preview for it that's
worth confirming for real (`vercel env pull` and inspect, or check the
dashboard directly) before relying on it.

## Database schema
Full schema already exists at `prisma/schema.prisma` and is migrated live to
Supabase — do not regenerate from scratch; schema changes go in new
migrations. Eleven tables: `users`, `packages`, `package_images`,
`package_itinerary_days`, `package_departures`, `inquiries`, `gallery_images`,
`testimonials`, `site_config`, `announcements`, `audit_log`. The SDD Section
3.5 Data Dictionary is now out of date for packages — schema.prisma is the
authoritative, current version.

Package design (changed from the SDD in migration
`20260925000000_split_package_status_add_itinerary_departures`):
- `status` is publication only (DRAFT / PUBLISHED); `availability` is separate
  (OPEN / ALMOST_FULL / FULL / COMING_SOON) so a published package can be
  almost full
- Itinerary is a child table: one row per entry, `dayStart`/`dayEnd` so an
  entry can span "Day 2–4"
- Departure dates are a child table with their own per-date availability
  (OPEN / ALMOST_FULL / FULL); "upcoming" = `departureDate >= today`
- `slug` (unique) for public URLs, plus `highlights[]` (card bullets),
  `inclusions[]` ("What's included"), `durationDays`/`durationNights`,
  `roomSharing`
- Saving a package replaces its itinerary and departure rows in one
  transaction

Migration workflow (avoids `migrate dev`, which can offer to reset the live
DB on drift): edit schema → `prisma migrate diff --from-config-datasource
--to-schema prisma/schema.prisma --script -o prisma/migrations/<ts>_<name>/migration.sql`
→ review the SQL → `prisma migrate deploy` → `prisma generate` (all with
`--config prisma7.config.ts`).

Pricing: flat rate per pax, `NUMERIC(10,2)`, no multi-currency or seasonal
variation, no payment gateway in this version — all bookings/payment happen
manually offline (bank details shared privately by Admin after a confirmed
booking, never published on the site).

## Design system (from approved mockups — match these exactly)
- **Colors:** Primary blue `#1B5FA8`, darker blue `#123A66`, admin sidebar blue
  `#0D2C4E`, pale blue `#EAF2FA`, orange accent `#F07C1E` (dark `#C7630F`,
  pale `#FDECDC`), background `#F5F9FC`, near-black text (not pure black)
  `#1A2733`, muted text `#5B6B7A`, border `#DCE6EF`, green `#2E7D5B` / pale
  `#E4F5EC`, danger `#C0392B` / pale `#FDEDEB`
- **Fonts:** Poppins (headings, 600–700 weight), Inter (body/UI, 400–600
  weight)
- **Layout convention:** Centered logo + nav bar header (not side-by-side),
  hero with search/filter bar overlapping its bottom edge, category pill
  filters (not dropdowns) for package browsing, sticky price card on package
  detail pages, admin dashboard uses a dark sidebar (`#0D2C4E`) + light content
  area, table-based (not card-based) admin lists
- Full HTML/CSS reference mockups are in `Web Mockups/` (`fig-*.html` plus
  PNG screenshots, and `moghul-homepage-mockup-v2.html`) for: homepage, login,
  admin dashboard, user management, add-admin modal, login error states,
  package listing, package detail, admin package list, package form, form
  validation errors — these are pixel-accurate references for matching
  styling, not just inspiration. Mockups for modules 3–7 don't exist yet;
  follow the same visual language.
- SRS and SDD PDFs are in `Documentation MTT WEB/`

## Project structure
```
app/
  (public)/          — public pages: home, packages, gallery, testimonials,
                        about, contact
  (admin)/           — auth-gated admin dashboard, one folder per module
  api/                — route handlers = Controllers (see SDD Section 3.2.1)
components/
  ui/                 — reusable primitives
  public/             — public-site components
  admin/              — admin-dashboard components
lib/
  supabase/           — Supabase client instances
  prisma.ts           — Prisma client singleton
  auth.ts             — auth helpers + RBAC checks
  email.ts            — Resend helpers
prisma/
  schema.prisma        — already complete, migrated
generated/prisma/       — Prisma 7 output, gitignored, regenerated on install
```

## Modules (7, matching SRS use cases UC-MTT-001 to 007)
1. User Access & Account Management — login, Master Admin invites/removes
   Admin accounts, 5-failed-attempt lockout (15 min)
2. Manage Packages — CRUD, category filter (Umrah/Ziarah/Group Tour/
   Domestic), image upload direct-to-Storage (bypasses API for the upload
   itself, only the URL gets saved via the Controller)
3. Manage Inquiries — public form (name, phone, email, package interest,
   message, CAPTCHA) → email notification to Admin; email failure must NOT
   block the inquiry from saving or the visitor's success message
4. Manage Gallery — same direct-to-Storage upload pattern as packages
5. Manage Testimonials — simple CRUD, no images
6. Manage Content Pages — key-value site_config, bulk update
7. Manage Announcements — auto-expiry based on `expires_at`, no cron needed
   (checked server-side on each page request)

Full sequence-diagram-level detail (exact API calls, validation order,
exception handling) for every module is in SRS Section 3 if a flow is
ambiguous — check there as a starting point for edge-case behavior.

## What's already done (infrastructure)
- Next.js scaffolded, TypeScript + Tailwind + App Router
- All core dependencies installed (`@supabase/supabase-js`, `@supabase/ssr`,
  `zod`, `resend`, `react-hook-form`, `prisma`)
- Supabase project created and connected, all 9 tables migrated
- GitHub repo: `github.com/naufalbeg/Moghul-Travel-Tours` (personal account,
  deliberate — portfolio value)
- Deployed to Vercel (`moghul-travel-tours.vercel.app`), project name
  `moghul-dev/moghul-travel-tours`
- Environment variables set on Vercel (see caveat above)
- **Known limitation:** Vercel's GitHub auto-deploy-on-push integration would
  not connect (a persistent platform-side issue, several fixes attempted and
  ruled out — not a project misconfiguration). Deploys are currently manual:
  `git push` then `vercel --prod`. Fine to revisit later, not urgent.

## What's next (build order)
1. Design system foundation — Tailwind v4 `@theme` tokens matching the
   color/font values above, shared layout components (header, footer, admin
   sidebar)
2. Supabase + Prisma client setup (`lib/supabase/`, `lib/prisma.ts`)
3. Public site: homepage → package listing → package detail → inquiry form
4. Admin side: login → dashboard → each management module

## Working conventions
- Prefer complete, working files over partial snippets/diffs when generating
  new files
- Zod validation on every API route, even though TypeScript types exist —
  types don't validate runtime data from outside the type system
- RBAC checks happen in Controllers (API routes), not just hidden in the UI
- Soft-delete for packages (`deleted_at`), hard-delete for inquiries,
  testimonials, announcements, gallery images
- Match the SDD's Controller/Model naming when creating API routes and
  Prisma-touching functions (e.g. `PackageController`-equivalent logic in
  `app/api/admin/packages/route.ts`) — makes it easy to trace an endpoint
  back to its SDD Detail Design entry if behavior is ever in question

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

Business facts that override the mockups: the agency has been operating for
**about a decade** — never say "25+ years", "since 1998" or "3,000+ pilgrims"
(mockup filler). Umrah and Ziarah are **one** category everywhere: enum `UMRAH_ZIARAH`,
label "Umrah & Ziarah", URL `/packages?category=umrah-ziarah` (`umrah` /
`ziarah` are kept as URL aliases). Footer credit is "Developed by MNB"
(Mirza Naufal Beg).

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
  (public)/           — public pages (URL has no prefix): home, packages,
                         gallery, testimonials, about, contact. Layout = header,
                         footer, floating WhatsApp button
  admin/
    login/            — /admin/login (no sidebar)
    (portal)/         — /admin/* behind requireAdmin(); layout = AdminShell
                         (dark sidebar + top bar). One folder per module
    actions.ts        — signOut server action
  api/                — route handlers = Controllers (see SDD Section 3.2.1)
components/
  ui/                 — primitives: icons.tsx (all SVG icons), logo-mark.tsx
  public/             — site-header, nav-links, mobile-menu, site-footer,
                         whatsapp-button
  admin/              — admin-shell, admin-nav (sidebar items + page titles)
lib/
  site.ts             — fixed facts (name, legal name) + public nav
  site-content.ts     — editable content: keys, defaults, phone/WhatsApp/map
                         helpers (shared with the browser)
  site-config.ts      — getSiteContent(): site_config rows over defaults,
                         once per request (server-only)
  prisma.ts           — Prisma client singleton (pg driver adapter)
  supabase/           — config.ts (env checks), server.ts, client.ts
                         (browser), admin.ts (secret key, bypasses RLS),
                         proxy.ts (session refresh)
  auth.ts             — getCurrentAdmin / requireAdmin (pages) /
                         authorize (API routes) RBAC helpers
  email.ts            — Resend helpers (not yet written)
proxy.ts              — Next 16 "middleware": refreshes admin sessions and
                         redirects signed-out users away from /admin
prisma/
  schema.prisma       — migrated
generated/prisma/     — Prisma 7 output, gitignored, regenerated by the
                         `postinstall` script (needed on Vercel)
```

Auth rules: a Supabase session alone isn't enough — the user must also exist
in `users` and be `isActive`. Every admin page calls `requireAdmin()` (or
`requireAdmin("MASTER_ADMIN")`); every admin API route calls `authorize()`.
proxy.ts is only an optimistic redirect, never the real check.

Styling: use the Tailwind tokens from `app/globals.css` (`bg-primary`,
`text-ink`, `border-line`, `bg-navy`, `font-heading`, `bg-hero`, …) rather
than raw hex values. Public body text is 17px; the admin shell uses 15px.

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
- Live at https://moghul-travel-tours.vercel.app (the `…-moghul-dev.vercel.app`
  URL sits behind Vercel's team SSO protection — that's expected).
- Deploys are manual: `git push` then `vercel --prod`. The project lives in
  the `moghul-dev` Vercel team (Hobby) while commits are authored by GitHub
  user `naufalbeg`, a different Vercel account. Hobby blocks that for
  **private** repos ("commit author did not have contributing access"), so
  the GitHub repo is kept **public** — making it private again will re-block
  deploys. A blocked deployment never un-blocks; redeploy after fixing. This
  mismatch is likely also why GitHub auto-deploy never connected — worth
  retrying `vercel git connect` now that the repo is public.

## Admin accounts
- Master Admin: Mirza Raziq, `moghul@gmail.com` (Naufal's father). Created
  with `npm run create-master-admin` (scripts/create-master-admin.mts), which
  takes MASTER_ADMIN_EMAIL / MASTER_ADMIN_NAME / MASTER_ADMIN_PASSWORD from the
  environment — never commit a password. Re-running it resets the password
  and clears any lockout, so it's also the recovery path.
- Login: server action in app/admin/login/actions.ts. 5 consecutive wrong
  passwords → `locked_until` = now + 15 min (tracked in `users`, logged to
  audit_log). Unknown emails get a generic error with no attempt counter.
- Any admin can change their own password at /admin/account (SRS rule: 8+
  chars, a number, a special character).
- No "forgot password" email flow yet — needs Resend, comes with invitations.

## Branding
Real logo files: `public/brand/moghul-logo.png` (full logo, white background
baked in — only on white surfaces) and `public/brand/moghul-globe.png`
(transparent globe, used by `LogoMark` and as `app/icon.png`). Use the
`Logo` / `LogoMark` components. Real company details from the logo: Co. Reg.
No. 1273862-K, MOTAC licence KPK/LN 9109.

## What's next (build order)
1. ~~Design system foundation~~ — done (tokens, header, footer, admin shell)
2. ~~Supabase + Prisma client setup~~ — done
3. ~~Master Admin seed + working login + change password~~ — done
4. ~~Public homepage, package listing, package detail~~ — done.
5. ~~Admin package CRUD~~ — done (/admin/packages, /new, /[id]/edit).
6. ~~Module 6 content pages~~ — done: /about, /contact, /admin/content.
7. ~~Testimonials, Gallery, Announcements (Modules 5, 4, 7)~~ — done.
8. ~~Inquiries (Module 3)~~ — done.
9. Remaining: user management invites (Module 1). Needs a verified sending
   domain in Resend (moghultt.com DNS) to email anyone other than
   moghultt@gmail.com.

## Editable content (Module 6)
- All contact details, office hours, licence numbers, About text and social
  links live in `site_config` (keys in lib/site-content.ts). Never hard-code
  them — read `getSiteContent()` in a server component and pass values down.
  The public layout already loads it once per request.
- Missing keys fall back to SITE_CONTENT_DEFAULTS; empty optional fields
  (mobile, alt email, MATTA, social links) are hidden on the site.
- Admin editor: /admin/content → updateSiteContent (writes only changed
  keys, audit action UPDATE_CONTENT). Validation in
  lib/validation/site-content.ts (Malaysian phone, https:// links).
- The unsaved-changes warning covers reloads/closing the tab; in-app
  sidebar links don't trigger it (Next client navigation).

## Testimonials, Gallery, Announcements
- Testimonials: /admin/testimonials (+ /new, /[id]/edit), public
  /testimonials; homepage shows the newest one. Hard delete.
- Gallery: /admin/gallery — label (tag) + drag-and-drop upload via
  lib/image-uploads.ts (signed URLs, bucket `gallery-images`), then
  saveGalleryImages records rows. Public /gallery with tag pills and a
  manual-only lightbox. Delete removes the Storage file and the row.
- Announcements: /admin/announcements (+ /new, /[id]/edit). Live = status
  ACTIVE and (expires_at null or in the future) — `liveAnnouncementWhere`
  in lib/announcements.ts. "Show until" date = end of that day in Malaysia
  (UTC+8). Public: <AnnouncementBar> at the top of the public layout, hidden
  when nothing is live. Turn off/on = status EXPIRED/ACTIVE.
- Shared admin UI: components/admin/field.tsx (Field, fieldClass,
  PageHeader, primaryButton) and ConfirmActionButton (pass a server action
  bound with .bind(null, id)).
- "use server" files may only export async functions — keep constants in
  lib/ (e.g. MAX_GALLERY_BATCH in lib/storage-config.ts).

## Inquiries (Module 3)
- Public form: /inquire (?package=<slug> pre-selects) and on /contact. Every
  "Inquire" button uses `inquireHref(slug)` in lib/site-content.ts.
- submitInquiry (app/(public)/inquire/actions.ts): Zod → hCaptcha verify
  (lib/captcha.ts) → save NEW → Resend alert (lib/email.ts) to site_config
  `inquiry_notify_email`. Email failure never blocks: `notified_at` stays
  null and the admin detail page shows "Not sent".
- Resend has NO verified domain yet: sender is onboarding@resend.dev and it
  can only deliver to the account owner, **moghultt@gmail.com**. After
  verifying moghultt.com set EMAIL_FROM (e.g. "Moghul Travel & Tours
  <noreply@moghultt.com>").
- Env: NEXT_PUBLIC_HCAPTCHA_SITE_KEY (public by design), HCAPTCHA_SECRET_KEY,
  RESEND_API_KEY — in .env and on Vercel (production + development).
- Testing: build/start with hCaptcha test keys (site
  10000000-ffff-ffff-ffff-000000000001, secret 0x000…000) so headless
  browsers pass; point inquiry_notify_email at delivered@resend.dev to avoid
  mailing the real inbox.
- Admin: /admin/inquiries (status tabs, newest first), /admin/inquiries/[id]
  (WhatsApp/call/email shortcuts, status New/In progress/Resolved, delete only
  when resolved). Sidebar shows the count of NEW inquiries.

## Security model (important)
- Migration `20260926000000_lock_down_public_data_api` enables RLS (no
  policies) and revokes anon/authenticated on every app table. The Supabase
  REST/Data API is NOT used — all data goes through Prisma (table owner,
  bypasses RLS). Any new table must get the same treatment (default
  privileges are revoked for future tables, but add `ENABLE ROW LEVEL
  SECURITY` in its migration too).
- Storage buckets (`npm run setup-storage`): `package-images`,
  `gallery-images` — public read, JPG/PNG/WEBP ≤5MB enforced by the bucket.
  No storage RLS policies: uploads only via signed upload URLs that a server
  action issues after `authorize()` (see createPackageImageUploads). The
  browser uploads straight to Storage; only the object path is saved.

## Admin package module
- Server actions in app/admin/(portal)/packages/actions.ts:
  `createPackageImageUploads`, `savePackage(id, input, "draft"|"publish")`,
  `deletePackage` (soft delete). Validation shared with the form:
  lib/validation/package.ts — drafts need only a title; publishing needs
  description, price > 0 and ≥1 image.
- Saving replaces itinerary/departure/image rows wholesale in a transaction;
  photos removed in an edit are deleted from Storage. Soft-deleted packages
  keep their photos.
- Audit actions: CREATE_PACKAGE, UPDATE_PACKAGE, PUBLISH_PACKAGE,
  UNPUBLISH_PACKAGE, DELETE_PACKAGE.
- Client components must not export helpers that server code calls (Next
  errors: "Attempted to call X() from the server").

## Public pages — how they work
- Package reads live in lib/packages.ts (public side of PackageController):
  only `status: PUBLISHED` and `deletedAt: null`. They call `connection()`,
  so every public page renders per request — admin changes show immediately,
  no revalidation needed.
- Vercel functions run in `sin1` (Singapore, vercel.json) next to the
  Supabase DB (ap-southeast-1) — don't remove that.
- Category filter slugs (`?category=`): `umrah-ziarah`, `group-tour`,
  `domestic` (plus `umrah` / `ziarah` individually) — lib/package-labels.ts.
- Package URLs are `/packages/<slug>`.
- Gallery/testimonial sections on the homepage only render when data exists.
- `npm run sample-packages` adds mockup packages (slugs `sample-*`) for
  testing; **`-- --remove` deletes them. Dev and prod share one database, so
  published samples appear on the live site — always remove them.**

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

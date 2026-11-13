@AGENTS.md

# Moghul Travel & Tours — Website Management System

## What this is
A production website for Moghul Travel & Tours Sdn Bhd, a MOTAC-licensed Malaysian
travel agency (Umrah & Ziarah, outbound and inbound tours, cruises) based in Shah Alam.
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
("Dibangunkan oleh MNB" in Malay; Mirza Naufal Beg). The public site is
**Malay-first** (owner's request, 2026-10-05) — see "Languages" below.

Target audience skews older (40s–60s, families, Hajj/Umrah pilgrims, retired
couples) — legibility and simplicity are design requirements, not nice-to-haves.
Body text 18px (never under 15px), large touch targets, no auto-advancing
carousels (the exceptions are the photo slideshows — the package-listing
banners the owner asked for and the homepage hero — which fade, have a Pause
button and don't autoplay for prefers-reduced-motion), phone/WhatsApp contact
always visible.

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

### Supabase connection pooling — two URLs, both matter
- `DATABASE_URL` (runtime, used by the app via lib/prisma.ts) = **Transaction
  pooler, port 6543**. The Session pooler caps ALL clients at 15; a few warm
  Vercel instances exhausted it and pages crashed with `EMAXCONNSESSION max
  clients reached in session mode` (2026-09-26). Never point the app back
  at 5432.
- `DIRECT_URL` (Prisma CLI only, via prisma7.config.ts) = **Session pooler,
  port 5432**. `prisma migrate` silently hangs forever on the Transaction
  pooler (it runs `SET session_replication_role`, unsupported there).
- Scripts in scripts/ use DATABASE_URL (transaction mode works for them).

## Environment variables
Already set locally (`.env`, gitignored) and on Vercel (all 3 environments):
`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, plus the hCaptcha/Resend keys.
(Vercel's Preview DATABASE_URL is still the old 5432 value — unused, fix if
preview deploys are ever used.)
**Double-check `NEXT_PUBLIC_SUPABASE_URL` on Vercel is actually the plain
`https://bgomzagmktakkqmkiqdn.supabase.co` URL and not the publishable key's
value** — `vercel env ls` showed an ambiguous truncated preview for it that's
worth confirming for real (`vercel env pull` and inspect, or check the
dashboard directly) before relying on it.

## Database schema
Full schema already exists at `prisma/schema.prisma` and is migrated live to
Supabase — do not regenerate from scratch; schema changes go in new
migrations. Thirteen tables: `users`, `packages`, `package_images`,
`package_itinerary_days`, `package_departures`, `package_price_list`, `inquiries`, `gallery_images`,
`banner_images`, `testimonials`, `site_config`, `announcements`, `audit_log`. The SDD Section
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
  `inclusions[]` ("What's included" / "Termasuk dalam pakej", green ticks),
  `exclusions[]` ("Not included" / "Tidak termasuk", red crosses; owner's
  request 2026-10-06), `durationDays`/`durationNights`
- Saving a package replaces its itinerary and departure rows in one
  transaction

Migration workflow (avoids `migrate dev`, which can offer to reset the live
DB on drift): edit schema → `prisma migrate diff --from-config-datasource
--to-schema prisma/schema.prisma --script -o prisma/migrations/<ts>_<name>/migration.sql`
→ review the SQL → `prisma migrate deploy` → `prisma generate` (all with
`--config prisma7.config.ts`).

Pricing (owner's settled list, 2026-10-06): prices aren't fixed — airfares
are included and change — so the site always says **"Starts from RM X"**.
Each package has a price list in `package_price_list`: one row per price
type, `amount` NUMERIC(10,2) per person; no row = not offered. The seven
types, in display order: `ADULT_TWIN`, `ADULT_TRIPLE`, `SINGLE`,
`CHILD_TWIN`, `CHILD_WITH_BED`, `CHILD_NO_BED`, `INFANT` (0–2 years).
They're text checked by the app, not an enum — PRICE_TYPES in
lib/package-prices.ts is the single source (plus `prices.types` wording in
both dictionaries), so adding a type is a code-only change. Adult types =
Adult Twin, Adult Triple, Single: "Starts from" is the lowest of those
(`startingPrice()`; child/infant never count) and publishing needs at least
one. Public: a two-column "Jenis | Harga" table (label + short hint, price)
at the bottom of the package page — only types with a price — plus the
editable `price_note` (site_config), and a "Bilik twin, triple atau single"
line under the title from the adult types offered. Admin form: the same
seven rows with an RM input each. Malay labels follow jomventures.my
("Kanak-kanak dengan/tanpa katil", "Bayi"); the hints ("Sebilik dengan 1
dewasa"…) are standard industry meanings — owner to confirm.
History: a traveller × room table (`package_prices`, Adult/Child ×
Twin/Triple, 2026-10-05) came first; migration
`20261006000000_package_price_list_and_exclusions` copied it (Adult/Twin →
ADULT_TWIN, Child/Twin → CHILD_TWIN), and once that code was live
`20261006010000_drop_package_prices` dropped `package_prices` and
converted old booking snapshots to `{type, count, amount}`. Before that, a single `price_per_pax` + free-text `room_sharing` were
dropped the same way — expand-then-contract is how any breaking schema
change is done here, since dev and the live site share one database.
No multi-currency or seasonal variation, no payment gateway in this version —
all bookings/payment happen manually offline (bank details shared privately
by Admin after a confirmed booking, never published on the site).

## Design system (the redesign, live since 2026-11-12)
The whole site, public and admin, follows the approved homepage mockup
`Web Mockups/moghul-homepage-mockup-v6.html`. The older `fig-*.html` mockups
and `moghul-homepage-mockup-v2.html` are history: don't match them any more.
It is merged into `main` and live. Everything below is defined once, in
`app/globals.css`.
- **Colours** (`@theme`): primary `#1B5FA8`, primary-dark `#123A66`
  (headings, dark buttons), navy `#0D2C4E` (hero, page banners,
  footer, admin sidebar), primary-pale `#EAF2FA`, canvas `#F3F7FB` (tinted
  sections, the admin's page background — the body itself is white), ink
  `#1A2733`, muted `#4A5968`, line `#D9E3EC` (dividers, card borders), field
  `#7F90A0` (borders of anything you type in or press: 3:1 on white), accent
  `#F07C1E` with accent-hover `#E46F12`, accent-dark `#A8530C` (orange as
  *text*), whatsapp `#15803D` / whatsapp-dark, success `#27704F`, danger
  `#C0392B`.
- **Contrast rules:** orange buttons and badges take **ink** text, never
  white (white on the orange is 2.9:1); WhatsApp buttons use `bg-whatsapp`
  (white text 5:1). On navy or photo surfaces add the `on-dark` class so the
  focus ring turns white.
- **Font:** Atkinson Hyperlegible Next for everything (next/font,
  `--font-atkinson`; a variable font, 200–800). Headings are 700–800 with
  tight tracking; `font-heading` still works but is the same family.
- **Text sizes:** `text-fine` 15, `text-meta` 16, `text-body` 18 (public
  default), `text-lead` 20, `text-title` 22, `text-price` 24, `text-display`
  28; section headings use `.h-section`. Nothing public is under 15px. The
  admin's base is 16px (`text-meta`) with `text-sm` (14) for secondary text.
- **Corners:** `rounded-lg` 10px (controls), `rounded-xl` 14px (cards),
  `rounded-2xl` 20px (big panels) — the Tailwind defaults are redefined, so
  don't write `rounded-[14px]`.
- **Shared classes:** `.wrap` (1280px content column), `.section`, `.btn` +
  `.btn-wa` / `.btn-primary` / `.btn-accent` (the page's one main action) /
  `.btn-outline` / `.btn-ghost` (on navy), `.btn-sm` / `.btn-lg`,
  `.arrow-link` + `.nudge` (arrow steps forward on hover), `.text-link`,
  `.spinner`, `.reveal`, `.rise`, `.search-bar` / `.seg`. Admin buttons keep
  their utility strings (`primaryButton` in components/admin/field.tsx).
- **Breakpoints:** `sm` 640, `mid` 900 (two-column sections stack below it),
  `lg` 1024, `nav` 1240 (the top menu folds into a Menu button below it).
- **Motion:** 150ms for colour/press, 250ms for movement, 400ms reveals, all
  `ease-smooth`; one global `prefers-reduced-motion` rule turns it all off.
- **Icons:** one family in components/ui/icons.tsx, one stroke weight (2) at
  every size. No text glyphs standing in for icons: star ratings are
  `<Stars>` (components/ui/stars.tsx), arrows are ArrowLeft/ArrowRight icons.
- **Feedback and loading:** `.appear` (a saved / sent / error message
  settles in), `.spinner` on busy buttons, `.skeleton` blocks
  (app/admin/(portal)/loading.tsx), and for a clicked link whose page is
  still loading `<PendingDim>` / `<PendingSpinner>`
  (components/public/link-pending.tsx — menu links and package cards).
  Placeholder text is #5D6B78 (5.4:1); tables use tabular numerals.
- **Admin specifics:** type scale 24 (top-bar title, the page's only h1) /
  22 / 18 / 16; a page never repeats its top-bar title — `PageHeader` takes
  one line saying what is in the list, plus the main action; shared button
  strings `primaryButton` and `rowButton` in components/admin/field.tsx; the
  current sidebar item is a filled row (no coloured edge); table rows tint
  under the pointer (`.admin tbody tr:hover`).
- **Reading measure:** long text is `max-w-[60ch]`, which in this typeface
  is about 75 characters a line.
- **Layout conventions:** one-line sticky header (logo, menu, BM | EN, green
  WhatsApp number button); left-aligned navy hero and page banners (nothing
  centred); sections alternate white and canvas; rules and spacing group
  things rather than boxes; filters are underlined text tabs with counts
  (`tabClass` in components/ui/tabs.ts — **not pills**: Naufal called pill
  buttons an "AI slop" element on 2026-11-12, and not dropdowns either); in
  forms, a choice between a few options is a row of squared buttons; sticky price
  card on package pages; admin = navy sidebar + canvas content, table lists.
- Naufal's design / security / legal checklists are in "Quality checklists"
  at the very end — use them when relevant.
- SRS and SDD PDFs are in `Documentation MTT WEB/`

## Project structure
```
app/
  (public)/           — public pages (URL has no prefix): home, packages,
                         gallery, testimonials, about, contact. Layout = sticky
                         header, footer, and on phones a WhatsApp | Telefon
                         bar pinned to the bottom (no floating bubble)
  admin/
    login/            — /admin/login (no sidebar)
    (portal)/         — /admin/* behind requireAdmin(); layout = AdminShell
                         (dark sidebar + top bar). One folder per module
    actions.ts        — signOut server action
  api/                — route handlers = Controllers (see SDD Section 3.2.1)
components/
  ui/                 — primitives: icons.tsx (all SVG icons), logo-mark.tsx
  public/             — site-header (+ sticky-header), nav-links,
                         mobile-menu, site-footer, contact-bar,
                         hero-slideshow, package-search (+ search-submit),
                         package-card, page-banner, pill, reveal-on-scroll
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
  email.ts            — Resend helpers (inquiry alert, invite, reset)
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
`text-ink`, `border-line`, `border-field`, `bg-navy`, `bg-canvas`, …) and the
shared classes (`.btn`, `.wrap`, …) rather than raw hex values — see "Design
system". Public body text is 18px; the admin shell uses 16px.

## Modules (7, matching SRS use cases UC-MTT-001 to 007)
1. User Access & Account Management — login, Master Admin invites/removes
   Admin accounts, 5-failed-attempt lockout (15 min)
2. Manage Packages — CRUD, category filter (Umrah & Ziarah / Outbound /
   Inbound / Cruise), image upload direct-to-Storage (bypasses API for the upload
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
- Live at **https://moghultt.com** since 2026-11-13 (www.moghultt.com and
  plain http forward to it). https://moghul-travel-tours.vercel.app still
  works too; the `…-moghul-dev.vercel.app` URL sits behind Vercel's team SSO
  protection — that's expected.
- **Domain and DNS (2026-11-13):** moghultt.com is registered through
  ServerFreak (WebNic, expires 2027-07-19) and its DNS is edited in the old
  host's cPanel → Zone Editor — log in at **https://cpanel.moghultt.com**
  (moghultt.com/cpanel now opens the website). Records that matter:
  apex **A 216.198.79.1 and A 64.29.17.1** (Vercel), **www CNAME
  b30bd7f640a2d29e.vercel-dns-017.com**, **mail A 185.93.164.203** and
  **MX → mail.moghultt.com** (mail stays on ServerFreak), plus the old
  host's own subdomains (cpanel, webmail, ftp, autodiscover…, all A
  185.93.164.203) and TXT records (SPF, DKIM, Facebook verification) — leave
  those alone — and Resend's five records (2026-11-14; listed under
  "Inquiries"). Mailboxes on ServerFreak: info@moghultt.com and
  raziq@moghultt.com. **Keep the ServerFreak hosting plan**: the DNS zone and
  the mailboxes live in it. Vercel issues and renews the https certificates
  itself. The www → moghultt.com forward is a redirect in next.config.ts;
  siteUrl() (lib/site-url.ts) picks moghultt.com up automatically from
  VERCEL_PROJECT_PRODUCTION_URL — after any domain change, redeploy so
  links, sitemap and structured data follow.
- **Don't make moghul-travel-tours.vercel.app forward to moghultt.com.**
  Before the switch, the old ServerFreak site sent moghultt.com/ (the
  homepage only) to moghul-travel-tours.vercel.app with a permanent 301 and
  no expiry, so browsers that saw it remember it and still jump from
  moghultt.com to the vercel.app address. A forward back would send those
  browsers round in a loop ("too many redirects"). The vercel.app address
  keeps serving the site; its pages already name moghultt.com as the real
  address (canonical), so search engines move over by themselves.
- Deploys are manual: `git push` then `vercel --prod`. The CLI's sign-in
  expires now and then (`vercel whoami` → "token is not valid"): run
  `vercel login`, which prints a link Naufal approves in his browser as
  `moghuldev`. The project lives in
  the `moghul-dev` Vercel team (Hobby) while commits are authored by GitHub
  user `naufalbeg`, a different Vercel account. Hobby blocks that for
  **private** repos ("commit author did not have contributing access"), so
  the GitHub repo is kept **public** — making it private again will re-block
  deploys. A blocked deployment never un-blocks; redeploy after fixing. This
  mismatch is likely also why GitHub auto-deploy never connected — worth
  retrying `vercel git connect` now that the repo is public.

## Admin accounts
- Master Admin: Mirza Raziq, `moghultt@gmail.com` (Naufal's father; was
  mistakenly created as the non-existent `moghul@gmail.com` and changed in
  place on 2026-10-02 — same account id and password). Created
  with `npm run create-master-admin` (scripts/create-master-admin.mts), which
  takes MASTER_ADMIN_EMAIL / MASTER_ADMIN_NAME / MASTER_ADMIN_PASSWORD from the
  environment — never commit a password. Re-running it resets the password
  and clears any lockout, so it's also the recovery path.
- Login: server action in app/admin/login/actions.ts. 5 consecutive wrong
  passwords → `locked_until` = now + 15 min (tracked in `users`, logged to
  audit_log). Unknown emails get a generic error with no attempt counter.
- Any admin can change their own password at /admin/account (SRS rule: 8+
  chars, a number, a special character).
- Staff accounts: /admin/users (Master Admin only). Invite → Supabase auth
  user with a random password + users row (joined_at null) + one-time link
  (lib/password-tokens.ts: SHA-256 hash stored, 24h invite / 1h reset) to
  /admin/set-password. If the email fails, the dialog shows the link to
  share manually. Deactivate = is_active false + Supabase ban; delete nulls
  FK references then removes the users row and auth user. The Master Admin
  row can never be modified.
- /admin/forgot-password emails a 1h reset link; same response for unknown
  emails. Since moghultt.com was verified in Resend (2026-11-14) invite and
  reset emails reach any address; the invite dialog's copy-link fallback
  stays for when an email fails.
- proxy.ts treats /admin/login, /admin/forgot-password, /admin/set-password
  as public.

## Branding
Real logo files: `public/brand/moghul-logo.png` (full logo, white background
baked in — only on white surfaces), `public/brand/moghul-mark.png` (globe +
orange swoosh + plane, transparent — used by `LogoMark` on a white badge in
the sidebar, footer and homepage About block) and
`public/brand/moghul-globe.png` (globe only — the favicon `app/icon.png`,
where the swoosh would be too small to see). Use the
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
9. ~~User management + forgot password (Module 1)~~ — done.
10. ~~Verify moghultt.com in Resend~~ — done 2026-11-14 (see "Inquiries").
    ~~Point moghultt.com at Vercel~~ — done 2026-11-13.
11. ~~Redesign~~ — done and live (2026-11-12): built on the `redesign`
    branch, merged into `main` and deployed the same day when Naufal said
    it was ready (see "Redesign"). Left over: his click-through of the
    signed-in admin screens, the owner's confirmation of the privacy notice
    and terms, and the other open items listed in that section.
12. ~~Contrast fix~~ — done with the redesign (ink text on orange, green
    #15803D).

## Languages (Malay-first, BM | EN switch)
- Modelled on jomventures.my: Malay for every visitor by default (not
  browser-language based); a "BM | EN" pill (components/public/
  language-switch.tsx) at the end of the desktop menu bar / beside the
  phone Menu button saves the choice in the `lang` cookie via the
  `setLanguage` server action (app/(public)/actions.ts), which re-renders
  the page. Same URLs in both languages — no /en prefix.
- Strings: lib/i18n/ms.ts is the master dictionary (`Dictionary` type);
  en.ts must match it. `{name}` placeholders + `fmt()` (lib/i18n/config.ts).
  Server components: `await getDictionary()` / `getLocale()`
  (lib/i18n/server.ts, cached per request). Client components:
  `useI18n()` — the public layout (and app/not-found.tsx) wrap pages in
  `<I18nProvider>` with only `dict.client`. New public text goes in BOTH
  dictionaries — never hard-code English in public code.
- Root layout sets `<html lang>` and the metadata from the locale; every
  public page uses `generateMetadata` with the dictionary. Dates/months:
  `formatDate(date, opts, locale)`, `upcomingMonths(locale)` ("14 Mac
  2027"). hCaptcha (`languageOverride`) and the Google map (`hl=`) follow.
- Translated: everything the site itself says, category/availability
  labels (Luar Negara, Dalam Negara; Cruise stays "Cruise"), price table,
  durations ("Hari 2–4"), WhatsApp pre-filled messages, form errors
  (validation returns codes — lib/validation/inquiry.ts). NOT translated:
  admin-typed content (packages, announcements, gallery tags, reviews) —
  shown as entered, like Jom Ventures. Kept in English on purpose (owner,
  2026-10-05): "Admin login", the footer's "© … All rights reserved." and "Developed by
  MNB", and the banner slideshow's Play/Pause (marked `lang="en"`). The
  footer's second number is "WhatsApp: <whatsapp>" (a wa.me link), not the
  mobile number.
- The admin portal stays English (app/admin/layout.tsx wraps it in
  `lang="en"`); lib/package-labels.ts / package-prices.ts labels are the
  admin's English ones.

## Editable content (Module 6)
- The homepage banner (hero_title / hero_message), contact details, office
  hours, licence numbers, About text and social links live in `site_config` (keys in lib/site-content.ts). Never hard-code
  them — public pages read `getPublicContent()` (lib/site-config.ts: the
  content in the visitor's language); admin code reads `getSiteContent()`.
  The public layout already loads it once per request.
- TRANSLATED_KEYS (hero_title, hero_message, about_summary, about_story,
  price_note, office_hours) are Malay; each has an optional English twin
  `<key>_en` — blank = English visitors see the Malay text. The editor
  shows them as "— Bahasa Melayu" / "— English" pairs (`bilingual()`).
- Missing keys fall back to SITE_CONTENT_DEFAULTS; empty optional fields
  (mobile, alt email, MATTA / MITA / PAPUH, social links) are hidden on the site.
- Membership numbers (footer badges + About "Licensed & registered"):
  MOTAC licence, company reg., MATTA (MA 5895, set by the owner), MITA
  (default A924) and PAPUH (default PP 276) — owner, 2026-10-06. No fax
  anywhere (the office line is gone; `phone` currently holds the mobile
  number, same as WhatsApp — owner's explanation, leave it).
- Admin editor: /admin/content → updateSiteContent (writes only changed
  keys, audit action UPDATE_CONTENT). Validation in
  lib/validation/site-content.ts (Malaysian phone, https:// links).
- The unsaved-changes warning covers reloads/closing the tab; in-app
  sidebar links don't trigger it (Next client navigation).

## Testimonials, Gallery, Announcements
- Testimonials: /admin/testimonials (+ /new, /[id]/edit), public
  /testimonials; homepage shows the newest three. Hard delete.
- Gallery: /admin/gallery — label (tag) + drag-and-drop upload via
  lib/image-uploads.ts (signed URLs, bucket `gallery-images`), then
  saveGalleryImages records rows. Public /gallery with label tabs (with
  photo counts) and a manual-only lightbox. Delete removes the Storage file and the row.
- Announcements: /admin/announcements (+ /new, /[id]/edit). Live = status
  ACTIVE and (expires_at null or in the future) — `liveAnnouncementWhere`
  in lib/announcements.ts. "Show until" date = end of that day in Malaysia
  (UTC+8). Public: <AnnouncementBar> at the top of the public layout, hidden
  when nothing is live. Turn off/on = status EXPIRED/ACTIVE.
- Banners: /admin/banners — photo "slots" defined in lib/banners.ts (key,
  label, shape, how many photos), stored in `banner_images` + bucket
  `banner-images`. Two kinds: the five package-listing banners ("packages",
  "packages-<category slug>": up to 5 photos, cropped to a 3:1 strip,
  ≤2400×800) and the homepage's two category photos ("door-umrah-ziarah",
  "door-outbound": one photo each, 3:2, ≤1600 wide). Cropping uses the
  shared ImageCropDialog (`shape` prop); add/remove/reorder save immediately
  (app/admin/(portal)/banners/actions.ts). Public: <PageBanner images> on
  /packages shows <BannerSlideshow> — fades every 3s (BANNER_SLIDE_MS),
  Pause button, no autoplay for reduced motion; no photos = the plain navy
  banner. The old "home" slot (photos behind the previous homepage hero) is
  no longer listed. Its four rows and files are still in the database and
  bucket, unused now that the redesign is live — delete them only when
  Naufal says so (they are the only copy of those banner crops).
- Shared admin UI: components/admin/field.tsx (Field, fieldClass,
  PageHeader, primaryButton, rowButton) and ConfirmActionButton (pass a
  server action bound with .bind(null, id)).
- "use server" files may only export async functions — keep constants in
  lib/ (e.g. MAX_GALLERY_BATCH in lib/storage-config.ts).

## Inquiries (Module 3)
- Public form: /inquire (?package=<slug> pre-selects) and on /contact. Every
  "Inquire" button uses `inquireHref(slug)` in lib/site-content.ts.
- submitInquiry (app/(public)/inquire/actions.ts): Zod → hCaptcha verify
  (lib/captcha.ts) → save NEW → Resend alert (lib/email.ts) to site_config
  `inquiry_notify_email`. Email failure never blocks: `notified_at` stays
  null and the admin detail page shows "Not sent".
- Resend: moghultt.com is a verified domain (2026-11-14, region Tokyo
  ap-northeast-1 — nearest to Malaysia). Sender is "Moghul Travel & Tours
  <noreply@moghultt.com>", the default in lib/email.ts (EMAIL_FROM
  overrides it; not set anywhere). There is no noreply mailbox: inquiry
  alerts carry Reply-To = the visitor. Its DNS records sit in the
  ServerFreak zone (cPanel → Zone Editor) and must stay: TXT
  `resend._domainkey` (DKIM key), MX `send` → feedback-smtp.ap-northeast-1.
  amazonses.com (priority 10), TXT `send` "v=spf1 include:amazonses.com
  ~all", CNAME `rsend` → send.forge.rmta.net (Resend's own sending
  servers), and TXT `_dmarc` "v=DMARC1; p=none;" (reports nothing, blocks
  nothing). The root SPF / MX are ServerFreak's mail — never add Resend to
  them. Resend's free plan caps sending at 100 emails a day.
- Env: NEXT_PUBLIC_HCAPTCHA_SITE_KEY (public by design), HCAPTCHA_SECRET_KEY,
  RESEND_API_KEY — in .env and on Vercel (production + development).
- Testing: build/start with hCaptcha test keys (site
  10000000-ffff-ffff-ffff-000000000001, secret 0x000…000) so headless
  browsers pass; point inquiry_notify_email at delivered@resend.dev to avoid
  mailing the real inbox.
- Admin: /admin/inquiries (status tabs, newest first), /admin/inquiries/[id]
  (WhatsApp/call/email shortcuts, status New/In progress/Resolved, delete only
  when resolved). Sidebar shows the count of NEW inquiries.
- Testing without mailing anyone: run `next start` with `RESEND_API_KEY=`
  (empty → email skipped, "Not sent" in admin) — no need to touch the live
  inquiry_notify_email.

## Booking requests ("Borang Tempahan", owner's request 2026-10-05)
- Modelled on jomventures.my: a booking form at the bottom of each package
  page (`#tempahan`, components/public/booking-form.tsx). The sidebar's
  main button is "Tempah sekarang" (jumps to it); "Buat pertanyaan" stays
  as the second button for window shoppers.
- Shown only when `canBookOnline()` (lib/validation/booking.ts): package
  OPEN or ALMOST_FULL with an upcoming date that isn't FULL, and an adult
  price. Otherwise the old inquiry-only button.
- Fields: contact (shared `ContactFields` in components/public/
  form-fields.tsx — same rules as the inquiry form), departure date (shown
  as "1–8 Jun 2027" via `formatTripDates`; FULL dates disabled), −/+
  counters per price type (keys "ADULT_TWIN", "INFANT"…, ≤20 each,
  ≤50 total, ≥1 adult — Single counts), running estimated total, notes, hCaptcha. No
  payment — "Tiada bayaran dikenakan sehingga tempahan disahkan".
- `submitBooking` (app/(public)/packages/[slug]/actions.ts) re-checks the
  package, date and prices from the database (never the browser's totals)
  and saves an Inquiry with kind BOOKING + package_id, departure_date,
  travellers JSON snapshot `[{type, count, amount}]` and
  estimated_total. Prices edited meanwhile → "pageOutdated" banner.
- Same email alert (subject "New booking request: …") and the same admin
  Inquiries list: "Booking request" badge, "Departs … · N pax", and a
  traveller/price table on the detail page. Form errors are codes shared
  with the inquiry form (`FormErrorCode` → dictionary `client.formErrors`).

## SEO
- app/sitemap.ts (dynamic, includes published packages and the two legal
  pages), app/robots.ts (disallows /admin, /api). Absolute URLs come from
  lib/site-url.ts (VERCEL_PROJECT_PRODUCTION_URL).
- Every public page sets `alternates.canonical` (search filters on
  /packages all point at /packages).
- Structured data (lib/structured-data.ts, rendered with `<JsonLd>`):
  TravelAgency on the homepage; Product with a MYR "starts from" offer plus
  BreadcrumbList on each package page. Only facts already on the page.
- app/opengraph-image.png is the link-preview card (what WhatsApp shows):
  logo on white over a navy band with the headline and the four categories,
  1200×630, with app/opengraph-image.alt.txt. It was rendered from a small
  HTML file with the installed Chrome; redo it the same way if the headline
  or categories change (it is a static image, not generated from content).

## Security model (important)
- Migration `20260926000000_lock_down_public_data_api` enables RLS (no
  policies) and revokes anon/authenticated on every app table. The Supabase
  REST/Data API is NOT used — all data goes through Prisma (table owner,
  bypasses RLS). Any new table must get the same treatment (default
  privileges are revoked for future tables, but add `ENABLE ROW LEVEL
  SECURITY` in its migration too).
- Storage buckets (`npm run setup-storage`): `package-images`, `banner-images`,
  `gallery-images` — public read, JPG/PNG/WEBP ≤5MB enforced by the bucket.
  No storage RLS policies: uploads only via signed upload URLs that a server
  action issues after `authorize()` (see createPackageImageUploads). The
  browser uploads straight to Storage; only the object path is saved.
- Browser security headers (2026-11-12): proxy.ts now runs on every page
  and gives each response a Content-Security-Policy with a one-time nonce
  (lib/security-headers.ts — Next.js puts the nonce on its own scripts);
  under /admin it also does the session check as before. The policy allows
  scripts only from this site, images from Supabase Storage, connections to
  Supabase and hCaptcha, and frames for hCaptcha and the Google map.
  **Adding any outside service (analytics, a video embed, a font host)
  means adding its address there, or the browser blocks it.** The fixed
  headers (nosniff, Referrer-Policy, X-Frame-Options, Permissions-Policy,
  HSTS) are set in next.config.ts.
- The policy forbids eval, so Zod runs "jitless"
  (lib/validation/zod-config.ts, imported by every file in lib/validation —
  keep that import in any new validation file).
- `dangerouslySetInnerHTML` is used in exactly one place,
  components/ui/json-ld.tsx (structured data: a JSON block with every "<"
  escaped, never run as script). Never use it for anything rendered as HTML.

## Admin package module
- Server actions in app/admin/(portal)/packages/actions.ts:
  `createPackageImageUploads`, `savePackage(id, input, "draft"|"publish")`,
  `deletePackage` (soft delete). Validation shared with the form:
  lib/validation/package.ts — drafts need only a title; publishing needs
  description, at least one adult price and ≥1 image.
- Package photos are 16:9 everywhere (`aspect-video`; PACKAGE_IMAGE_ASPECT in
  lib/storage-config.ts). Every upload goes through ImageCropDialog
  (components/admin/image-crop-dialog.tsx, react-easy-crop): the admin drags
  and zooms a fixed 16:9 frame, lib/crop-image.ts renders a ≤1920×1080 JPEG
  and only that is uploaded — so originals up to 25MB are accepted. "Adjust
  crop" re-crops a saved photo (Supabase Storage sends CORS headers, so the
  canvas works) and swaps its path once the new upload succeeds.
- Public package page: components/public/package-gallery.tsx — a sliding
  strip with ← → buttons, swipe, arrow keys and thumbnails; no auto-advance.
- Highlights / What's included / Not included use `PointListField`
  (components/admin/point-list-field.tsx; owner's request 2026-10-16): one
  auto-growing box per point, so a point can wrap over several lines. Enter
  = new point, Backspace at the start joins it to the one above, pasting
  several lines (bullets stripped) makes one point each. Limits: 15
  highlights, 20 included / not included, 500 chars per point
  (lib/validation/package.ts); per-point errors show on that point. Cards
  show the first 3 highlights (2 lines each); the package page shows them all
  under "Tarikan utama".
- Saving replaces itinerary/departure/image rows wholesale in a transaction;
  photos removed in an edit are deleted from Storage. Soft-deleted packages
  keep their photos.
- Admin note (`packages.admin_note`, ≤300 chars; owner's request
  2026-10-06): an admins-only note — mainly whose package it is, Moghul's
  own or a partner's like Suka Travels. Edited in "Basic details" (grey box
  with a lock icon), shown in the package list's last column, right beside
  Delete, and under "Package" on a booking request's page in Inquiries
  (the note as it reads now; plain inquiries have no package link, so
  none). Never public: public queries `select` their fields, and
  getPublishedPackage (the one `include`) has `omit: { adminNote: true }` —
  keep it that way in any new public query.
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
- Categories (enum PackageCategory): UMRAH_ZIARAH, OUTBOUND (tours abroad),
  INBOUND (tours within Malaysia), CRUISE — set by the owner on 2026-09-26,
  replacing GROUP_TOUR/DOMESTIC (renamed in place by migration
  `20260930000000_outbound_inbound_cruise_categories`).
- Category filter slugs (`?category=`): `umrah-ziarah`, `outbound`,
  `inbound`, `cruise`; aliases `umrah` / `ziarah` / `group-tour` /
  `domestic` still resolve — lib/package-labels.ts.
- The top nav has a single "Packages" link (owner's request); categories
  are the tabs on /packages (`<CategoryTabs>`, each with its package count
  for the current search), the homepage's two category photos and link
  rows, and the homepage search.
- "Other Packages" / "Pakej Lain" (after Packages; owner's request
  2026-10-06) opens Moghul's agent page on Muslim Travel Bug's booking
  portal — `OTHER_PACKAGES_URL` in lib/site.ts
  (app.travelcrm.co/destinations/moghultt-gmail-2; Moghul is a certified
  Muslim Travel Bug agent). PUBLIC_NAV items with `external: true` render
  as a plain `<a target="_blank">` with an external-link icon and a
  screen-reader "(opens in a new tab)", and never slide.
- Page slides: top-menu links and category tabs carry `transitionTypes`
  nav-forward / nav-back (item right / left of the current one —
  components/public/nav-links.tsx, category-tabs.tsx). `<SlideTransition>` (components/public/slide-transition.tsx,
  React `<ViewTransition>`) wraps every page via app/(public)/template.tsx,
  and on /packages the banner and results are wrapped again with
  `key={category}` so a same-route category change slides too. Slide CSS is
  at the end of app/globals.css (~350ms, off for prefers-reduced-motion).
  Other links and browser back don't animate. New public pages under
  (public)/ get it automatically.
- Package URLs are `/packages/<slug>`.
- /packages: the banner says how many packages there are and what they
  start from; the search bar sits across its lower edge with destination
  and month, filled in with the current search (the category stays with the
  tabs and travels as a hidden field; the tabs in turn keep the search); a
  result line appears only while searching.
- Package page: jump links under the title (Tarikan, Termasuk, Itinerari,
  Harga, Borang Tempahan), sections ease in as they are scrolled to, the
  booking form is an open form under a rule with two groups ("Butiran
  anda", "Perjalanan anda"), and up to three other packages of the same
  category follow at the bottom.
- /testimonials with no reviews says so and shows customer photos
  (`<PhotoStrip>`, also on /about); never a made-up review.
- /privacy and /terms: lib/legal.ts holds both documents in Malay and
  English; each page shows the visitor's language first and the other under
  it. **Drafted by Claude from what the site actually does. They went live
  with the redesign on 2026-11-12 on Naufal's decision, before the owner had
  confirmed the wording — that confirmation is still owed.** They promise nothing
  about payment, cancellation or refunds. Both forms end with a line saying
  what the details are used for and a link to the notice.
- `formatPrice` joins "RM" and the amount with a non-breaking space, so a
  price never splits across lines.
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
- Images are served unoptimized (`images.unoptimized: true` in
  next.config.ts, 2026-11-03): the Vercel Hobby image-optimization quota ran
  out and every image then returned 402. Uploads are already cropped and
  resized in the browser, so little is lost — don't switch it back on
  without a paid plan.

## Project skills (.claude/skills)
- Besides the prisma-* skills: impeccable (UI design/critique/polish),
  accessibility, seo, web-design-guidelines, transitions-dev,
  transitions-polish, supabase-postgres-best-practices, webapp-testing
  (Python Playwright) and pick-ui-library (manual only). Added 2026-11-11
  from `Documents\MOGHULTT\moghul-skills`. Also ui-ux-pro-max (local Python
  search over style/palette/font/UX data:
  `python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux`)
  and banner-design (HTML/CSS social and ad banners), from the same folder's
  `ui-ux-pro-max-skill-main` download; its other five sub-skills (ui-styling
  = shadcn, slides, design, brand, design-system) were left out on purpose.
- This file wins over their generic advice: the mockups and design tokens,
  the older-audience rules (18px body, large targets, no auto-advance), the
  ~350ms page slide, and the security model — RLS on with NO policies and
  all data through Prisma, so don't add policies or use the Data API because
  a Supabase skill suggests it. impeccable reads PRODUCT.md (product truth
  for design work: audience, positioning, evidence on hand, written
  2026-11-11); DESIGN.md comes once a redesign is actually built.
- webapp-testing / screenshots: `pip install playwright`, then launch with
  `p.chromium.launch(channel="chrome")` — it drives the installed Chrome, so
  no `playwright install` browser download is needed. Airbnb blocks headless
  browsers (blank page); the other reference sites work.
- transitions-dev / transitions-polish are gitignored (their license forbids
  publishing the collection; this repo is public) — on another machine copy
  them in by hand from the folder above.
- impeccable downloads its engine from github.com/pbakaus/impeccable releases
  on first use (checksum-verified, cached in ~/.impeccable).

## Redesign (built, merged and live, 2026-11-12)
- Why: Naufal finds the current public site looks "AI-made / vibe-coded" —
  specifically the template layout (everything centred, hero → cards →
  gallery → about) and samey components (identical cards, outline buttons
  and pills everywhere). Not the colours.
- Status: on 2026-11-12 he approved mockup v6 ("i like this design") and
  asked for it on the whole website, admin included, on its own GitHub
  branch. The `redesign` branch holds it: homepage built to the mockup, the
  other public pages and the admin portal moved onto the same design system
  (see "Design system"). That evening he said it was ready to replace the
  old site: `redesign` was merged into `main` (merge commit 1c31389) and
  deployed to production, and the live site was checked afterwards (every
  page answers, nothing blocked by the security policy, hCaptcha and the
  map load, slideshow runs, phone layout). The `redesign` branch is kept on
  GitHub but is now the same as `main`; new work goes on `main` as before.
  `Web Mockups/moghul-homepage-mockup-v6.html` stays as the reference
  (v3–v5 beside it are history). On 2026-11-13 moghultt.com itself was
  switched to the new site (see "Domain and DNS").
- Second pass, same day (he asked for the ten references, the 20 rules,
  the security and legal lists and the installed skills to be applied to
  every page and the admin): search on /packages, package-page jump links
  and related packages, privacy and terms pages, form consent lines,
  structured data and canonical addresses, a new link-preview card, one
  icon weight and drawn stars, loading and pending feedback, security
  headers with a per-request Content-Security-Policy, and in the admin a
  to-do-style dashboard (components/admin/dashboard-view.tsx: what needs
  attention, latest inquiries, the site's state, shortcuts — no counter
  cards), status tabs and a title search on the package list, password
  rules that tick off as you type, a loading skeleton, and no page title
  said twice. impeccable's detector was run once; its findings (stranded
  phone number in the footer, over-long lines, a card inside a card, the
  admin's heading sizes) were fixed.
- What was checked on the branch (local production build, 2026-11-12):
  type-check, lint, `next build`; 68 browser checks in two suites (hero
  slideshow, scroll reveals and their no-script / reduced-motion fallbacks,
  both search bars, jump links, keyboard order and focus rings, legal
  pages, structured data, phone menu and contact bar, language switch);
  nothing blocked by the security policy on any page, with hCaptcha, the
  map and the photo cropper working under it; the forms' in-browser checks
  still working; axe WCAG 2.2 on every public page plus the sign-in pages
  at 1440 and 390px (0 violations); screenshots at 1440 / 1024 / 768 / 390
  in both languages.
  **Not checked in a browser: the signed-in admin screens** — that needs
  an admin sign-in, which Claude doesn't have and must not create (a
  temporary account on the live auth system was rightly blocked). Their
  shell, tables and package form were checked in a throwaway preview with
  made-up data; Naufal should look through the real ones after signing in.
- How the homepage is wired (app/(public)/page.tsx): one query for all
  published packages feeds the hero slideshow (covers, shuffled per request,
  at most 12), the six featured cards, the category counts and the
  departures list (each package's next non-full date, soonest first).
  `splitHeadline()` puts what follows the first dash or comma of
  `hero_title` in orange. Reviews render only when the testimonials table
  has rows; the customer-photo band shows the five newest gallery photos.
- How the open decisions were settled when building (all easy to change):
  - Hero photos: cover photos only, 12 per visit.
  - Door photos: the admin's own photo if one is set in /admin/banners
    (new 3:2 slots), else a package cover from that category, else — for
    Umrah & Ziarah only — `public/home/umrah-ziarah.jpg`, a 3:2 copy of the
    gallery's Kaabah photo.
  - Search suggestions: a new editable text, `search_destinations`
    (Content pages → Homepage banner), a comma-separated list; its default
    is the 21 places in today's packages, so it needs keeping in step.
  - Search button: real now — `next/form` + `useFormStatus` show "Mencari…"
    until the results arrive.
  - Footer: "Notis privasi" and "Terma penggunaan" now link to real pages
    (second pass); "Admin login" sits beside them in the bottom row.
  - About block: no placeholder photo — the summary beside the licence
    list; an owner/team/office photo can take the left side once supplied.
  - Package cards show only each highlight's name (the text before a colon
    or dash), since real highlights are full sentences.
  - Scroll reveals need no inline script: `RevealOnScroll` (in the public
    template) hides only blocks still below the screen when a page opens.
- Naufal's follow-up the same day: don't tell visitors up front that Moghul
  is a certified Muslim Travel Bug agent — the "Ejen bertauliah" line was
  removed from the homepage and About licence lists (the "Pakej Lain" link
  and the terms page still name the portal it opens); and replace the pill
  filters with something more modern — now text tabs with counts, on the
  public site and in the admin lists.
- Still open: the wording of the three booking steps (Claude's — owner to
  confirm); the privacy notice and terms (Claude's draft — owner to
  confirm) and a refund / cancellation policy (the owner's to write; the
  terms only tell visitors to ask); signed-in admin flows under the new
  security policy (photo upload and crop, sign-in) need one click-through
  by Naufal, since Claude cannot sign in; the live hero title and message
  both say "dirancang dengan teliti" (owner's copy edit); owner photos and
  real reviews to collect (never invent one); a destination field on
  packages if the suggestions list becomes a chore; the old "home" banner
  photos to delete once this is live.
- Seen while testing, not caused by the redesign (the live site does it
  too): on /gallery the browser's background preload of the first tag pill
  sometimes never finishes. Harmless to visitors as far as seen; worth a
  separate look.
- v3 → v4 (his feedback, 2026-11-11: "pretty good but missing some oomph
  and refinement"): Pakej pilihan now sits above Berlepas tidak lama lagi;
  the hero photo became a slideshow of every gallery photo with no "Gambar
  sebenar" tag; the hero moved onto the brand navy with a white headline
  whose second phrase is the logo orange, the slideshow running off the
  right edge of the screen and the search bar overlapping the hero's bottom
  edge; departure dates became navy calendar tiles. The oomph went into the
  hero only, on purpose — the rest stays quiet.
- v4 → v5 (his feedback, 2026-11-11: "i like where this is going", two
  fixes): the hero photo no longer runs off the right edge of the screen (it
  read as the page "continuing beyond the webpage") — it sits inside the
  content column with all four corners rounded; and the hero now shows
  **package destination photos in random order**, not customer trip photos
  ("more clean and professional"; the customer photos already have their own
  band lower down). Also in v5, from the "unslop" checklist below: content
  column widened 1200 → 1280px so the contained photo stays large; the
  search bar lost its "Cari trip anda" title and the slideshow its "n /
  total" counter (redundant labels); buttons nudge down when pressed; the
  photo frame shows a loading sweep; the footer gained "Dasar privasi" and
  "Terma & syarat" links (those pages aren't written yet).
- v5 → v6 (2026-11-11: he asked to run the ten design references in
  "Quality checklists" against v5). What each one changed:
  - Animation (Apple): the hero's pieces rise in once on load; blocks ease
    in once as they are scrolled to (12px, 400ms, staggered 80ms across a
    row). Set up so nothing can stay hidden: the `reveals` class is only
    added by a `<head>` script when IntersectionObserver exists and reduced
    motion is off.
  - Onboarding (Duolingo): a new section, "Tempah dalam tiga langkah" (pilih
    pakej dan tarikh → hantar borang tempahan → kami hubungi anda) ending on
    the booking form's own line "Tiada bayaran dikenakan sehingga tempahan
    disahkan". Numbers only, no icons. Wording is Claude's — owner to
    confirm.
  - UI design (Linear): corner sizes and motion are tokens; the leftover
    inline styles became classes; the header gains a soft shadow once
    scrolled.
  - Typography (Pentagram): eleven text sizes below the headings became
    seven (`--t-fine` 15 … `--t-display` 28); headline leading tightened
    (h1 1.05, h2 1.1); `text-wrap: pretty` on paragraphs.
  - Minimalism (Muji): the line under "Ke mana anda ingin pergi?" was cut.
    Nothing else could go without losing information.
  - Search & filters (Airbnb): the search became one bar of three parts
    (Destinasi | Bulan berlepas | Kategori) and the orange button; each part
    is the control itself, 76px tall, so a click anywhere on it works. On
    tablets and phones the parts become filled boxes. Destinasi suggests
    the places named in the published packages (`<datalist>`). The button
    shows "Mencari…" with a spinner (simulated in the mockup).
  - Art direction (Aesop): places open the page, people prove it. The two
    doors now show places (the Kaabah from the gallery, the Taj Mahal from
    the Kashmir + Agra + Delhi package) and the Umrah group photo moved
    down to lead the customer-photo band.
  - Dashboard (Notion): not applicable to the homepage — it belongs to the
    admin portal, untouched.
  - Landing page layout (Stripe): the order already told the story (promise
    → search → choose → packages → dates → proof → who → contact); the
    steps section was the one missing piece.
  - Micro-interactions (Framer): package cards lift under the pointer;
    departure rows nudge their arrow and brighten the date tile; the
    slideshow caption dips out and in when the photo changes; the BM | EN
    pill and header ease between states.
- How it was chosen: impeccable rolled two directions (a Shah Alam Blue
  Mosque arcade, a family photo album); he picked the category standard
  "done properly" instead, benchmarked on jomventures.my, Airbnb,
  arbatravel.com, ibctours.com and muslimtravelbug.com.
- Kept: logo blue and orange, Malay-first, older-audience rules. Everything
  else was open. Lead message: "perjalanan mesra Muslim" as one umbrella
  over Umrah & Ziarah and holidays abroad.
- What v6 does, top to bottom: one-line header (logo left, nav, BM | EN,
  green WhatsApp button with the number); navy hero, left-aligned, beside
  the package-photo slideshow; search bar; two photo "doors" (Umrah & Ziarah /
  percutian luar negara) plus link rows for Dalam Negara, Cruise and Pakej
  Lain; six package cards (category · duration, title, three highlight
  names, "Bermula dari", next departure; whole card is one link); "Berlepas
  tidak lama lagi" — a dated list of the next departures; "Tempah dalam
  tiga langkah" — how booking works; a navy band of
  real customer trip photos; "who we are" with the About text and all
  licence numbers; reviews; a contact band; footer. Phones get a WhatsApp |
  Telefon bar pinned to the bottom instead of the floating bubble.
- Hero slideshow rules (v5): one photo per published package — its cover
  (first) photo — shuffled on every visit. The caption under the photo is
  the package's name, duration and "dari RM X"; it is the link, and its hit
  area covers the photo, so clicking the photo opens that package. Like the
  live banner slideshow it fades every 5s, has a Pause/Play button (English,
  like the banners) and ← → buttons that also stop it, and starts paused for
  prefers-reduced-motion. It also holds still while the mouse is on the
  photo or the link has keyboard focus, so the package that opens is the one
  being looked at. A photo is fetched only when about to show, the fade
  waits for it to load, and one that fails to load is skipped. The frame is
  3:2 (package photos are all 16:9, so about 8% is trimmed off each side).
  When built: shuffle on the server (public pages already render per
  request) so the first photo arrives with the HTML. The admin controls the
  homepage simply by choosing each package's cover.
- Changes from the current design if approved: font becomes Atkinson
  Hyperlegible Next (built for low-vision readers) instead of Poppins +
  Inter (load it with next/font, as now — the mockup's Google Fonts link is
  mockup-only); body 18px; no kicker labels above headings; no ★★★★★
  decoration; orange buttons take ink text; the homepage's admin-managed
  banner slideshow is replaced by the package-cover slideshow; "Admin login"
  moves to the footer.
- The decisions that were open before building are answered above ("How
  the open decisions were settled"). The Umrah door switches by itself from
  "dates are being finalised" to the package count once an Umrah package is
  published.
- Everything in the mockups is real data from the live site (2026-11-11):
  14 published packages (111 package photos, all 16:9), all Luar Negara,
  next departure 20 Nov 2026; 49 gallery photos. Placeholders (owner photo,
  reviews) are visibly labelled.
- Checks run on v5 and again on v6: axe WCAG 2.2 (0 violations, run after
  scrolling so every block is showing), impeccable detector (only
  false positives: section padding, the photo filling its frame, and the
  search bar's drop shadow read as a glow), slideshow behaviour test (order
  differs between visits, caption and link always match the photo, autoplay,
  hold on hover, pause, arrows, wrap-around, fast clicks, a failed photo is
  skipped, reduced motion, tab order), screenshots at 1920 / 1440 / 1024 /
  390px. v6 also: every reveal block shows after scrolling, nothing is
  hidden with scripts off or with reduced motion, search bar tab order and
  target heights (76px / 60px), the busy state, card hover, header shadow.
  v3 also passed the Vercel Web Interface Guidelines; later versions
  inherit those fixes.

## Quality checklists (Naufal's notes, 2026-11-11)
Collected by Naufal from software engineers' TikToks and Reels; he asked for
them to be kept here and used "when relevant and necessary". They are
prompts for judgement, not rules: where one clashes with this file (the
older-audience rules, Malay-first, the security model, anything the owner
asked for), this file wins. The "where this stands" notes are as checked on
2026-11-11 — re-check before relying on them.

### Design references (borrow the principle, not the look)
- Animation → apple.com · Onboarding → duolingo.com · UI design →
  linear.app · Typography → pentagram.com · Minimalism → muji.com · Search &
  filters → airbnb.com · Art direction → aesop.com · Dashboard → notion.com
  · Landing page layouts → stripe.com · Micro-interactions → framer.com
- Where each lands on this site: animation and micro-interactions = the page
  slides, the slideshows, button and form feedback (always with a
  reduced-motion fallback; nothing that moves on its own without a Pause);
  search & filters = the hero search and the /packages pills; landing page
  layout, typography, minimalism, art direction = the public redesign;
  dashboard = the admin portal; onboarding = the booking form and a new
  admin's invite → set password → first login (the public site has no
  accounts to onboard).
- What the sites actually do (looked at 2026-11-11 for mockup v6): their
  headlines are set tight — letter-spacing −0.02 to −0.05em, line-height
  1.0–1.07 — and not always heavy (Stripe 300, Linear 510, Apple 600);
  interface motion is short, 150–320ms, on ease-out curves (Apple
  `cubic-bezier(0.4, 0, 0.6, 1)`, Linear `cubic-bezier(0.32, 0.72, 0, 1)`);
  Apple puts a Pause button on its own moving hero; Duolingo's first screen
  is one sentence, one button and one quiet second choice; Airbnb's search
  is one bar of labelled parts with the button at the end; Stripe and
  Notion put the proof (logos) straight under the hero. Aesop sits behind
  a bot check and Muji would not load in a headless browser — don't try to
  get round either; work from what is generally known of them.

### 20 ways to "unslop" a page
1. Delete filler badges
2. Drop redundant labels
3. Un-italicise random words
4. Monospace only where needed
5. Use a design system
6. Show the actual product
7. Enlarge the main feature
8. Group with spacing
9. Make headlines specific
10. Emphasise the CTA
11. Add an accent colour
12. Keep icons consistent
13. Remove unnecessary embellishments
14. Inner radius = outer radius − padding (his note read "Outer Quarter
    Radius"; taken as the usual nested-corner rule)
15. Improve text contrast
16. Wrap headlines properly (`text-wrap: balance`)
17. Align by eye, not just by pixel size
18. Use tabular numbers
19. Add loading states
20. Animate useful feedback
- Learned on the mockups: tabular numbers suit columns of dates and prices
  (the departures list) but made large stand-alone prices look
  typewritten in Atkinson Hyperlegible, so they're not global. Rule 14 only
  bites when the padding is smaller than the outer radius (e.g. the phone
  menu: 14px panel, 8px padding, 6px items).

### Not getting hacked
1. Check forms for SQL injection
2. File upload checks
3. XSS protection
- Where this stands: every query goes through Prisma and every form input
  is Zod-validated first; there is no `$queryRaw` / `$executeRaw` anywhere,
  so there is no hand-built SQL to inject into. Keep it that way — if raw
  SQL is ever needed, use the tagged-template form, never
  `$queryRawUnsafe` with joined strings. Uploads only happen through signed
  URLs issued after `authorize()`, and the buckets enforce JPG/PNG/WEBP
  ≤5MB (see "Security model"). React escapes everything it renders and
  there is no `dangerouslySetInnerHTML` — never add one for admin-typed or
  visitor-typed text (the one JSON-LD data block in
  components/ui/json-ld.tsx is escaped and is not HTML). Since 2026-11-12
  every page carries a nonce-based
  Content-Security-Policy and the usual security headers — see "Security
  model". File uploads were re-checked: type and size are validated when
  the signed URL is issued and again by the bucket.

### Not getting sued (his list has 21 points)
1. Check local laws
2. Privacy policy
3. Terms of service
4. Refund policy
5. Cookie policy
6. Cookie consent banner
7. Check form consent
8. Audit third-party SDKs
9. Remove dark patterns
10. Don't collect unnecessary data
11. Remove hidden fees
12. Remove fake reviews
13. Remove unsupported claims
14. Accessibility: alt text
15. Fix colour contrast
16. Keyboard navigation
17. Add business details
18. Age consent for children's data
19. Unsubscribe link in emails
20. Licensed fonts and images
21. A way to request data deletion
- Where this stands (Claude's reading, not legal advice — the owner should
  confirm anything that matters):
  - Privacy notice and terms: live since 2026-11-12 at /privacy and
    /terms, each in **both Malay and English**
    as Malaysia's Personal Data Protection Act 2010 expects, linked from the
    footer and from both forms (which now each say what the details are used
    for). They are Claude's draft of what the site actually does — the owner
    has not confirmed them yet. Still missing: a refund / cancellation policy, whose
    wording is the owner's — never invent one.
  - Cookies: only functional ones (`lang`, the admin session, hCaptcha on
    the forms). No analytics or ad pixels, so no consent banner is needed
    today; adding analytics or a pixel changes that.
  - Third parties that see visitor data: Vercel (hosting), Supabase
    (database, photos), Resend (email), hCaptcha, the Google Maps embed. A
    privacy page should name them. Fonts are self-hosted by next/font.
  - Already in good shape: no invented reviews (rule above), claims limited
    to "about a decade" and real licence numbers, "Bermula dari" prices
    with the "Tidak termasuk" list and price note, company details in the
    footer, the booking form takes only head-counts for children (no
    child's personal details), emails are transactional only (no
    newsletter, so nothing to unsubscribe from).
  - Open: alt text is thin (package cards are decorative `alt=""` next
    to their title, which is fine; gallery photos only have their tag);
    where the package photos come from and whether Moghul may use them
    (they are destination shots, not Moghul's own — this matters more once
    they lead the homepage); asking for one's data to be deleted now has a
    public route: the privacy notice gives the email, WhatsApp and office
    contacts for it (admins can delete an inquiry once it is resolved).

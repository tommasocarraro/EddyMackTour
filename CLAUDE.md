# Eddy Mack — video portfolio

Portfolio website for a videomaker (creations hosted on YouTube). Public gallery +
project detail pages, plus a password-protected "Studio" area where he can add/edit
projects, upload thumbnails, and manage categories.

Note: "Eddy Mack" is a placeholder name (from the repo folder name), swap it out for
the real videomaker's name/brand when known — it currently appears in
`src/app/layout.tsx`, `src/components/Sidebar.tsx`, and the design mockup.

## Design reference

Visual direction was mocked up as a Claude Artifact before coding, based on
https://www.maurinepagani.com/ as the client's reference site, then refined through
feedback:
- Black background throughout (committed dark theme, not just prefers-color-scheme)
- Fixed left sidebar nav (brand, category filters, Studio link) on desktop; slides in
  from the left via a hamburger on mobile, with the hamburger on the right and the
  brand name on the left in the mobile top bar
- Square mosaic grid: 5 columns desktop, 3 columns mobile, separated by open gaps
  (no visible dividing line), no filler tiles on incomplete rows
- Fonts: Fraunces (serif, display/titles) + Archivo (sans, UI/body)
- Categories are many-to-many: a project can belong to more than one

## Stack

- Next.js 14 (App Router, TypeScript)
- Prisma + SQLite (`prisma/schema.prisma`) — `Project` and `Category`, many-to-many
- Auth: single admin account (no sign-up). Credentials in `.env`, session is a signed
  httpOnly JWT cookie (`src/lib/auth.ts`), `src/middleware.ts` protects `/admin/*`
  except `/admin/login`
- Thumbnails: uploaded via `multipart/form-data`, written to `public/uploads/`
  (gitignored) — fine for a single self-hosted server, won't survive on serverless
  platforms with ephemeral filesystems (e.g. Vercel) without swapping in real
  object storage later

## Routes

- `/` — gallery, filterable by category (`?category=Name`)
- `/project/[slug]` — detail page, embeds the YouTube video
- `/admin/login` — sign in
- `/admin` — dashboard: add/remove projects, manage categories (protected)

## Running it locally

```
npm install
cp .env.example .env
# then fill in .env (see below), then:
npm run db:push
npm run db:seed
npm run dev
```

### Setting the admin password

`.env` needs `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH_BASE64`. The hash is
base64-encoded because Next.js's `.env` loader expands literal `$` characters,
which corrupts a raw bcrypt hash otherwise.

```
node -e "console.log(Buffer.from(require('bcryptjs').hashSync('YOUR_PASSWORD', 10)).toString('base64'))"
```

Paste the output into `ADMIN_PASSWORD_HASH_BASE64`, restart `npm run dev`, log in
with `ADMIN_EMAIL` + the plain password you chose.

Also set `SESSION_SECRET` to a long random string (e.g. `openssl rand -hex 32`).

## Known follow-ups

- `npm audit` flags Next.js 14.2.x advisories only fully patched in Next 16 (a major
  upgrade) — fine for local dev, worth revisiting before deploying publicly.
- Thumbnail storage is local disk — move to S3/Cloudinary/etc. before deploying to
  a platform without persistent local storage.
- No image resizing/optimization on upload yet.
- "Eddy Mack" placeholder branding — replace with the real name once decided.

# Eddy Mack Tour — video portfolio

Portfolio website for a videomaker (creations hosted on YouTube). Public gallery +
project detail pages, plus a password-protected "Studio" area where he can add/edit
projects, upload thumbnails, and manage categories.

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
- Black + crimson red palette (`src/app/globals.css` `:root` variables), logo mark in
  `public/logo/`, favicon files generated from it in `src/app/favicon.ico`/`icon.png`/
  `apple-icon.png`
- A short looping/rotating logo intro plays fullscreen on every page load
  (`src/components/IntroLoader.tsx`), dissolving into the site after ~1.5s

## Stack

- Next.js 14 (App Router, TypeScript)
- Prisma + Postgres (`prisma/schema.prisma`) — `Project` and `Category`, many-to-many.
  Was SQLite during early local dev; moved to Postgres so the DB can live on a real
  host instead of a single local file (see Known follow-ups)
- Auth: single admin account (no sign-up). Credentials in `.env`, session is a signed
  httpOnly JWT cookie (`src/lib/auth.ts`), `src/middleware.ts` protects `/admin/*`
  except `/admin/login`
- Thumbnails: uploaded via `multipart/form-data`, sent straight to Cloudinary
  (`src/lib/uploads.ts`) and referenced by their `secure_url` — no local disk
  dependency, works on any host including ones with ephemeral filesystems

## Routes

- `/` — gallery, filterable by category (`?category=Name`)
- `/project/[slug]` — detail page, embeds the YouTube video
- `/about` — bio + portrait (`public/about/portrait.jpg`)
- `/admin/login` — sign in
- `/admin` — dashboard: add/edit/remove projects, add/remove categories (protected)

## Running it locally

```
npm install
cp .env.example .env
# then fill in .env (see below — needs a real Postgres DATABASE_URL, e.g. a free
# instance from Neon or Railway, or a local Postgres), then:
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

### Thumbnail uploads (Cloudinary)

`.env` needs `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` —
free account at cloudinary.com, values are on its dashboard.

### YouTube title/description autofill (optional)

When adding or editing a project, the Studio form calls the YouTube Data API v3
(`src/lib/youtube.ts` `getYoutubeMetadata`, via `src/app/api/youtube-metadata/route.ts`)
on blur of the YouTube link field to pre-fill empty title/description fields — it
never overwrites text already typed in. Set `YOUTUBE_API_KEY` in `.env` (enable
"YouTube Data API v3" on a Google Cloud project, then create an API key) to turn
this on; without it, autofill silently no-ops and the admin fills those fields in
by hand. This is separate from thumbnail autofill (`getYoutubeThumbnail`), which
builds a static `img.youtube.com` URL and needs no key.

## Known follow-ups

- `npm audit` flags Next.js 14.2.x advisories only fully patched in Next 16 (a major
  upgrade) — fine for local dev, worth revisiting before deploying publicly.
- No image resizing/optimization on upload yet (Cloudinary can do this on the fly via
  its URL transformation params if needed later).
- Database is Postgres now, but connecting to it still requires the host to be
  reachable at deploy time — pick a host with a managed Postgres add-on (Railway,
  Render, Neon) rather than wiring up a separate DB provider by hand.

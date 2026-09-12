# Eddy Mack Tour — video portfolio

A portfolio website for a videomaker whose work lives on YouTube. Visitors browse a
gallery of projects and watch them in place; the videomaker signs into a private
"Studio" area to add new work himself, without needing a developer involved.

This project exists to learn [Claude Code](https://claude.com/claude-code) by
building something real end to end — from a first design mockup through a working
full-stack app — rather than as a client deliverable.

## What it does

**Public site**
- A responsive gallery of projects, laid out as a square mosaic grid (4 columns on
  desktop, 3 on mobile)
- Filter the gallery by category from the sidebar
- Click a project to open its detail page: an embedded, playable YouTube video,
  description, client/role/year credits, and a link to the next project
- Fully responsive: a fixed sidebar nav on desktop that collapses into a
  hamburger-triggered drawer on mobile

**Studio (admin area)**
- Password-protected — only the videomaker can get in
- Add a new project: title, description, YouTube link, thumbnail image, and one or
  more categories
- Remove a project
- Add new categories on the fly (a project can belong to more than one — e.g. both
  "Commercial" and "Campaign")

## Stack

- [Next.js](https://nextjs.org/) (App Router, TypeScript) for both the frontend and
  the backend API routes
- [Prisma](https://www.prisma.io/) + SQLite for the database
- A signed, httpOnly session cookie for admin auth — no third-party auth provider
- Thumbnails are uploaded and stored on local disk

## Getting started

```
npm install
cp .env.example .env
```

Fill in `.env`:
- `ADMIN_EMAIL` — the login email for the Studio
- `ADMIN_PASSWORD_HASH_BASE64` — generate with:
  ```
  node -e "console.log(Buffer.from(require('bcryptjs').hashSync('YOUR_PASSWORD', 10)).toString('base64'))"
  ```
  (base64-encoded because Next.js expands literal `$` in plain `.env` values, which
  would otherwise corrupt the bcrypt hash)
- `SESSION_SECRET` — any long random string, e.g. `openssl rand -hex 32`

Then set up the database and run it:

```
npm run db:push
npm run db:seed
npm run dev
```

Visit `http://localhost:3000` for the site, `http://localhost:3000/admin/login` for
the Studio.

## Project structure

```
prisma/schema.prisma      Project + Category models (many-to-many)
prisma/seed.ts            Sample projects for local development
src/app/                  Pages and API routes (Next.js App Router)
src/components/           Sidebar nav + Studio dashboard components
src/lib/                  Auth, Prisma client, uploads, slugify, YouTube helpers
src/middleware.ts         Protects /admin/* behind the session cookie
```

See `CLAUDE.md` for design decisions and implementation notes from the build.

## Known limitations

- Thumbnails are stored on local disk (`public/uploads/`) — fine for a
  single self-hosted server, but won't persist on serverless hosts with an
  ephemeral filesystem (e.g. Vercel) without moving to real object storage.
- No image resizing/optimization on upload.
- `npm audit` flags Next.js 14.2.x advisories only fully patched in the Next 16
  major version — worth revisiting before deploying this publicly.

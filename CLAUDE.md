# Eddy Mack Tour — video portfolio

Portfolio website for a videomaker (creations hosted on YouTube or Vimeo). Public gallery +
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
- Fonts: Fraunces (serif, display/titles) + Helvetica (system font stack, UI/body);
  the header's "Eddy Mack Tour" name (sidebar + mobile top bar) in Eurostile (`--font-header`;
  a paid font, so it falls back to the Saira lookalike where it isn't installed), shown in
  all caps via CSS `text-transform`; other brand touches (e.g. the intro button) use Futura
  (`--font-brand`, falls back to Jost)
- Sidebar About link is bold, same font as the category filters (no arrow)
- Categories are many-to-many: a project can belong to more than one
- Black + crimson red palette (`src/app/globals.css` `:root` variables), hand-drawn logo
  (source: gitignored `public/intro/intro-logo-original.png`, black on transparent).
  Site mark is a white copy in `public/logo/logo-hand-white.png` (the sidebar and the
  thumbnail fallback use it); the favicons `src/app/favicon.ico`/`icon.png`/`apple-icon.png`
  are the black logo on a white square
- A fullscreen showreel intro (`src/components/IntroLoader.tsx`) loops, with the hand-drawn logo
  (`public/intro/intro-logo-white.png`, a white cropped copy of the gitignored black
  `intro-logo-original.png`) above an outlined Futura "Cut to the work" button, until the
  visitor presses it, then dissolves into the site. It shows once per
  browser session (`sessionStorage`) and never on `/admin`. An inline script in
  `layout.tsx` hides it before first paint for repeat views. It fills the
  screen: landscape screens get the 16:9 reel, portrait ones a separate vertical (9:16) cut,
  picked by a `(max-aspect-ratio: 1/1)` media query on the `<source>`/poster.
  Files in `public/intro/`: `intro-1080.webm`/`.mp4`, `intro-720.mp4` (small landscape
  screens), `intro-mobile-720.mp4` (vertical cut, 720×1280), `intro-poster.jpg` and
  `intro-mobile-poster.jpg` (first frames). They're encoded from the gitignored originals
  `website V4.mp4` (16:9) and `website mobile V4.mp4` (vertical): H.264 CRF 26 `-preset slow` /
  VP9 CRF 36, audio stripped, `+faststart`. The machine has no system ffmpeg; `npm install
  ffmpeg-static` in a temp dir provides one

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
- `/project/[slug]` — detail page, embeds the YouTube or Vimeo video. Clicking a card in the
  gallery opens it instead as a centered dialog over the blurred gallery (~44vw wide,
  kept narrow so the blur shows around it; closes via the X, a click outside, or Escape — all `router.back()`).
  The dialog grows out of the clicked card and shrinks back into it on close. This is a
  View Transition started in `Gallery.tsx`: the clicked card (found via its `data-slug`)
  temporarily takes the dialog's `view-transition-name`s, so the thumbnail flies into the
  player while the panel grows behind it. Timings and easing are in the "card ⇄ dialog
  morph" block of `globals.css`. Don't animate `backdrop-filter`/`clip-path` per frame
  (the old approach): that stuttered. Browsers without View Transitions, and reduced-motion
  users, get an instant open/close. The browser back button closes it without the animation.
  The dialog is opened client-side by `src/components/Gallery.tsx` from the project data
  the gallery already loaded (no server round trip, so the animation starts on click): the
  card's click calls `history.pushState` to `/project/[slug]`, and `Gallery` renders
  `ProjectModal` when `usePathname()` matches. The URL change (`pushState` on open,
  `router.back()` on close) runs only after the morph finishes. Run mid-animation, it made
  Next re-render during the transition, so on real phones the close often popped instead
  of animating. A direct visit or refresh shows the full page.
  Both share `src/components/ProjectDetail.tsx`; the dialog intentionally has no "Next
  project" link or footer. The player iframe (`src/components/VideoPlayer.tsx`) only
  mounts once the open animation finishes (loading it mid-animation made it stutter), with
  the thumbnail shown in its place until the player has loaded
- `/about` — bio, portrait (`public/about/portrait-web.jpg`, a 1200×1800 web copy of the full-size original), and a bold "Contact: <email>" line
  and a "Selected collaborations" logo strip (see "Adding a collaborator logo" below)
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

### Video links: YouTube and Vimeo

A project's video link can be a YouTube or a Vimeo one. It's stored in
`Project.youtubeUrl` (the column predates Vimeo support and wasn't renamed, to avoid a
migration). `src/lib/video.ts` picks the provider and is what the rest of the code
calls; `src/lib/youtube.ts` and `src/lib/vimeo.ts` hold the provider specifics.

In the Studio, `src/app/api/video-metadata/route.ts` looks up the title, description
and thumbnail for a link: when adding a project, and on blur of the link field when
editing (where it never overwrites text already typed in).

- YouTube: the thumbnail is a static `img.youtube.com` URL and needs no key.
  Title/description come from the YouTube Data API v3 and need `YOUTUBE_API_KEY` in
  `.env` (enable "YouTube Data API v3" on a Google Cloud project, then create an API
  key); without it they're left empty for the admin to fill in by hand.
- Vimeo: all three come from Vimeo's public oEmbed endpoint, no key. Private or
  domain-restricted videos aren't described by it, so those need a title and an
  uploaded thumbnail by hand. Links are saved in canonical form (`vimeo.com/<id>`,
  or `vimeo.com/<id>/<hash>` for unlisted videos, whose hash the player needs),
  dropping the long `?turnstile=...` param Vimeo adds to copied links.

## Adding a collaborator logo

The About page's "Selected collaborations" strip is a hardcoded list (not managed
from the Studio):

1. Put the logo file in `public/logos/collab/`, named in kebab-case (e.g. `bykilian.svg`).
   SVG or PNG with a transparent background; colour doesn't matter, since CSS
   (`filter: brightness(0) invert(1)`) renders every logo solid white. A JPG or
   anything with a solid background shows up as a white box; make the background
   transparent first. The same goes for text coloured on a filled badge (e.g. San
   Carlo's yellow-on-red), which vanishes unless it's cut out of the badge as
   transparency.
2. Add `{ name: "Brand", logo: "/logos/collab/<file>" }` to `COLLABORATORS` in
   `src/app/about/page.tsx`. List order is display order; `name` is the alt text.

Logos are shown at ~28px tall (20px on mobile), so prefer horizontal wordmarks: tall
or stacked marks (e.g. Università Iuav's vertical logo) become unreadable.

Clients from the owner's list still without a logo (to be supplied): Università Iuav
di Venezia (needs a horizontal version), Kilian, Sugarmusic, Pangea Group, ALMASpace,
70Materia, Doner Music, Light Masters.

## Known follow-ups

- `npm audit` flags Next.js 14.2.x advisories only fully patched in Next 16 (a major
  upgrade) — fine for local dev, worth revisiting before deploying publicly.
- No image resizing/optimization on upload yet (Cloudinary can do this on the fly via
  its URL transformation params if needed later).
- Database is Postgres now, but connecting to it still requires the host to be
  reachable at deploy time — pick a host with a managed Postgres add-on (Railway,
  Render, Neon) rather than wiring up a separate DB provider by hand.

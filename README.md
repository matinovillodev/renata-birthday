# Renata's first birthday invitation

A single-page, mobile-first digital invitation (fairy theme) built with Astro.
Guests open it from a link, see the date, time and place, find the venue on an
embedded map, and confirm attendance through a pre-filled WhatsApp message.

## Quick path

1. Use Node 24: `nvm use` (reads `.nvmrc`).
2. Install exactly what the lockfile pins: `npm ci`
3. Start the dev server: `npm run dev`, then open the printed local URL.

Everything a host would change lives in **one file**: `src/data/event.ts`.

## Personalize

### Event data (`src/data/event.ts`)

| Field | What it does |
| --- | --- |
| `childName` | Name in the headings, the intro and the WhatsApp message. |
| `startsAt` | Date and time as ISO 8601 **with offset**, e.g. `2026-11-28T13:30:00-03:00`. The page shows "Sábado 28 de noviembre · 13:30 hs" (no year). |
| `timeZone` | IANA zone used to display `startsAt`, e.g. `America/Argentina/Cordoba`. |
| `venue.name` | Venue shown in the details, the map caption and the closing. |
| `venue.mapEmbedUrl` | `src` of the embedded Google Map (see below). |
| `whatsapp.digits` | Number for the RSVP link: country code + area code + number, digits only (`5493517622809`). |
| `rsvp.message` | Text pre-filled in WhatsApp. Keep the blanks for name and number of people. |
| `copy` | Every visible Spanish text, in page order. Texts with the name or venue are built from the fields above. |

Reference fields (not shown on the page):

| Field | Note |
| --- | --- |
| `theme` | Documents the party theme. |
| `venue.mapsShareUrl` | The short Google Maps link, handy to double-check the place. |
| `venue.coordinates` | A unit test checks that `mapEmbedUrl` points at these coordinates. |
| `whatsapp.display` | Human-readable number; a unit test checks it matches `digits`. |
| `rsvp.deadline` | Keep `null`. The page has no deadline UI yet. |

Unknown facts go in as `[PLACEHOLDER: …]`, never invented values.

### Map

The default `mapEmbedUrl` uses the venue coordinates and needs no API key. To
use Google's official embed instead:

1. Open the place in Google Maps → **Share** → **Embed a map**.
2. Copy only the URL inside `src="…"` and paste it into `venue.mapEmbedUrl`.
3. The official URL does not contain `lat,lng` literally, so update the
   "points the map embed at the venue coordinates" test in
   `src/data/event.test.ts`.

### Photos (`src/assets/photos/`)

Replace the files **keeping their names**:

| File | Used for |
| --- | --- |
| `hero-portrait.jpg` | Hero on phones and portrait screens (also blurred behind the "Abrir invitación" curtain); photo band. |
| `hero-landscape.jpg` | Hero on landscape screens (also blurred behind the curtain); link preview image; photo band. |
| `band-landscape.jpg` | Chapter "El gran día"; photo band. |
| `closing-landscape.jpg` | Chapter "¿Nos acompañan?"; photo band. |

Each file must be a JPEG in **sRGB**, at most **2400 px** on the long edge, with
**no EXIF** (location and camera data). Astro generates the small AVIF/WebP
versions at build time. Never upscale a photo: the build only scales down.

New photos frame faces differently. Check the screenshots described under
[Checks](#checks) and, if needed, adjust:

- the hero top crops (`PORTRAIT_TOP_CROP`, `LANDSCAPE_TOP_CROP`) in `src/components/Hero.astro`;
- the chapter focal points (`focus`, `narrowFocus`) in `src/pages/index.astro`.

## Checks

| Command | What it verifies |
| --- | --- |
| `npm test` | Unit tests (Vitest): data consistency, date labels, WhatsApp link, motion helpers. |
| `npm run check` | Astro and TypeScript type checks. |
| `npm run build` | Production build into `dist/`. |
| `npm run test:e2e` | Playwright on phone, tablet and desktop, with and without reduced motion: intro, links, map, RSVP honesty, accessibility (axe), page weight. |

`npm run test:e2e` builds and serves the site itself and uses the installed
Google Chrome. Without it: `npx playwright install chromium`, then run with
`PW_CHANNEL=chromium`. Face-clearance screenshots land in
`test-results/layout-screenshots-for-face-clearance-review-*/`.

## Publish on Netlify

`netlify.toml` already sets the build (`npm run build`, publish `dist`,
Node 24) and the response headers.

| Option | Steps |
| --- | --- |
| Git-connected site | Push the repository, then in Netlify: **Add new site → Import an existing project**. Every push redeploys. |
| Netlify CLI | `netlify deploy --build` for a draft URL, add `--prod` for the live one. |

The link preview image (`og:image`) needs the site's public address:

- Builds run by Netlify get it automatically (Netlify sets `URL`).
- Builds on your machine must pass it: `URL=https://<site>.netlify.app npm run build`
  (same for the CLI). Otherwise previews point to `localhost`.

## Privacy

- Search engines are asked not to index the page (`noindex` meta tag and
  `X-Robots-Tag` header). Anyone with the link can still open it.
- The page shows the WhatsApp number and the venue to whoever has the link.
- Original photos in `images/` are git-ignored: they are never committed or
  deployed. Only the EXIF-free versions in `src/assets/photos/` are used.

## Possible follow-ups

- Add a Content-Security-Policy header. It needs a hash for the inline
  bootstrap script and rules for the Google Maps iframe, so it is not set yet.

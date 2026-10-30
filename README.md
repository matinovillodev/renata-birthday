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
| `hero-fairy.jpg` | Hero ("Luz de hadas") on every screen, also blurred behind the "Abrir invitación" curtain; link preview image. |
| `band-landscape.jpg` | Chapter "El gran día". |
| `closing-landscape.jpg` | Chapter "¿Nos acompañan?". |

Each photo appears once (an e2e test checks it), so every image a guest sees
is new.

Each file must be a JPEG in **sRGB**, at most **2400 px** on the long edge, with
**no EXIF** (location and camera data). Astro generates the small AVIF/WebP
versions at build time. Never upscale a photo: the build only scales down.

The hero photo is only **1672×941 px**, so phones with sharp screens (2x/3x)
show it slightly soft: a portrait phone draws it ~1500 px wide on screen and
would need ~4500 px. A higher-resolution export of the same image can replace
it as is (same name, same framing). Its composition is tuned to this photo:

- the face box in `e2e/hero.spec.ts` (headband to chin, cheek to cheek, as
  fractions of the photo) and the chin line `--hero-chin` in
  `src/components/Hero.astro`;
- the framing (`objectPosition`) and the portrait lift (`--hero-copy-fixed`,
  `--hero-lift`), which raises the photo just enough for the copy at the bottom
  never to cover the face.

New photos frame faces differently. Check the screenshots described under
[Checks](#checks) and run `npx playwright test e2e/hero.spec.ts`; if needed,
adjust the values above or the chapter focal points (`focus`, `narrowFocus`)
in `src/pages/index.astro`.

### Colors ("Luz de hadas" palette)

All colors live in `src/styles/tokens.css`, sampled from the hero photo: dark
warm `#3B2A27` (intro, chapter screens), cream `#FCF4EA` and peach `#F7E2D3`
(panels), cocoa `#4E3423` (text), rosa profundo `#9A4A57` (name, buttons,
links), moss `#5E6A3A` (WhatsApp button), gold `#D9A462` and coral `#EBA691`
(decoration, sparkles, fairies). The particles and fairies repeat a few of
them in `src/scripts/fairy-dust/` and `src/components/Fairies.astro`, and the
browser bar color is the `theme-color` in `src/layouts/Base.astro`.

Every text color must keep WCAG AA contrast (4.5:1, or 3:1 for large text):
`e2e/palette.spec.ts` checks the token pairings. Text over photos depends on
the photo and on the overlays (`--scrim-alpha`, `--veil-*`, `--halo-*`), so
re-measure it after changing either.

## Checks

| Command | What it verifies |
| --- | --- |
| `npm test` | Unit tests (Vitest): data consistency, date labels, WhatsApp link, motion helpers. |
| `npm run check` | Astro and TypeScript type checks. |
| `npm run build` | Production build into `dist/`. |
| `npm run test:e2e` | Playwright on phone, tablet and desktop, with and without reduced motion: intro, links, map, RSVP honesty, accessibility (axe), page weight, hero face clearance and image width. |

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

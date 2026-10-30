# Feature: invitacion-artesanal

Locator: `odd/tasks/invitacion-artesanal.md` (branch `feat/invitacion-artesanal`) · Engram mirror: `odd/invitacion-artesanal/tasks`

## Objective

Make the "Luz de hadas" invitation read like a hand-made printed invitation instead of a templated landing, applying the seven approved suggestions from the `frontend-design` review, and move the venue to "Centro de Jubilados 12 de Mayo".

## Problem and why

The 2026-10-30 design review (screenshots at 390×844 and 1440×900) found: every photo shown 2–3 times; studio photos cooler/greyer than the warm hero; template typography (tracked ALL-CAPS eyebrows, middle-dot meta strings, icon-circle + label + value trio); a raw Google Maps embed that clashes with the palette and shows a grey void while loading; repeated copy ("Te esperamos" twice, the date four times); too many simultaneous motion effects; an RSVP button that wraps to two lines on phones with lots of empty space. The user approved implementing all of them and changed the venue.

## Scope

- In: the seven suggestions below plus the venue rename. Tests and README alongside each change.
- Out: new sections, palette changes, the hero composition (keep it: it is the memorable piece), deploy, push.

## Constraints

- Branch `feat/invitacion-artesanal` from `87b1a03` (`feat/luz-de-hadas`), worktree `~/www/personal/reni-birthday-worktrees/invitacion-artesanal`. Do not touch other checkouts.
- Venue display name: "Centro de Jubilados 12 de Mayo" (user, 2026-10-30). Location confirmed by the user on 2026-10-30 (a different place, not a rename): share link `https://maps.app.goo.gl/E9QZ5DrBoGMBTAQG8`, coordinates -31.352343, -64.1810758; all of it centralized in `src/data/event.ts`; never invent an address.
- Keep the "Luz de hadas" palette, AA contrast (measured), reduced motion, no horizontal overflow, 44 px targets, the WhatsApp honesty rule, the T12 anchor behavior (`#confirmar` lands on the WhatsApp button), the hero face-clearance guard.
- Parallax was explicitly chosen by the user (V3): keep it.

## Tasks

- [x] H1 Venue → "Centro de Jubilados 12 de Mayo" in data, copy, alt/iframe titles, tests, README. Route: delegated (writer for H1–H8). Evidence: `venueName`, `mapsShareUrl` and one `venueCoordinates` constant in `src/data/event.ts` (the embed URL is now built from it); iframe title, OG description and every copy line derive from it; README has no literal venue. RED: new unit test "uses the venue confirmed by the family" + updated iframe-title test failed (2/6) → GREEN 59/59. `npx astro check` 0 errors; `npm run build` ok; `npx playwright test e2e/content.spec.ts` 24 passed. Open: `requirement.md` (outside the edit surface) still lists the old Maps link.
- [x] H2 Remove the duplicated photo strip (each photo should appear once where possible). Evidence: `PhotoBand.astro`, its strip parallax and `--radius-thumb` removed; the two masters only the band used (`hero-portrait.jpg`, `hero-landscape.jpg`) deleted from `src/assets/photos` (originals stay in the git-ignored `images/`); chapters renumbered 1–3. Photos now: hero (+ its blurred intro copy, same download), "El gran día", "¿Nos acompañan?". RED: new e2e "each photo appears once" listed 14 duplicated thumbnails → GREEN. `npm test` 59/59; `npx astro check` 0 errors; content + layout + navigation + motion + weight specs: 92 passed / 28 skipped.
- [x] H3 Warm, subtle grade of the studio photo masters so they match the hero's golden light (bake into masters, EXIF-free; no runtime filters). Evidence: `band-landscape.jpg` and `closing-landscape.jpg` regraded with Pillow (`python3 -I`, no numpy): gamma 0.93, gains R 1.025 / G 1.0 / B 0.95, then ≤ 9% blend toward gold `#FFD69E` on a luma smoothstep from 30% (mid-highlights only); saved 2400×1602 RGB progressive JPEG q81 4:2:0, no EXIF/ICC (359 KB and 370 KB, sizes unchanged within 1%). Measured on the wood floor (the most neutral area; it is brown, not grey): closing (1800,900)–(2340,1500) 138.7/99.6/73.8 → 149.9/107.4/77.4 (R/B 1.88 → 1.94); band (1800,1320)–(2340,1560) 125.3/87.9/67.8 → 136.1/95.3/71.0 (R/B 1.85 → 1.92). Whole-image means: closing 123.8/92.9/63.9 → 133.7/100.0/66.1; band 134.4/102.0/78.3 → 144.5/109.0/80.5. Side-by-side with the hero reviewed: warmer and slightly brighter, still clearly the same photos. Grade recipe in README (photos). No meaningful RED (visual asset change). `npm test` 59/59; `npx astro check` 0 errors; build ok (Playwright web server); layout + a11y + weight: 32 passed / 16 skipped.
- [x] H4 De-template typography: no tracked ALL-CAPS labels (hero lead-in, details labels, scroll hint, intro "Primer cumpleaños", chapter eyebrows) — sentence case / italic lead-ins instead; no middle-dot meta strings; event details as one invitation sentence ("El sábado 28 de noviembre, a las 13:30, en el Centro de Jubilados 12 de Mayo.") built from `event`, replacing the icon-circle trio; hero lead-in flows into the name; the date never orphans "· 13:30 hs". Done together with H6 (one commit: the details heading and the closing date block are the same edits). Evidence: `formatEventDate` now returns phrases (`sábado` / `28 de noviembre` / `a las 13:30`, "a la" at 1 o'clock, no padded hour); new `src/lib/text.ts` (`keepTogether` joins a phrase with no-break spaces, `plainSpaces` for meta); copy: `hero.leadIn` + name + `hero.when()` read as one sentence ("Te invitamos al primer cumpleaños de / Renata / el sábado 28 de noviembre, a las 13:30"), `details.sentence()` is the section's h2 (icon trio, labels and `dateTimeSeparator` removed; "en el" travels with the venue), `intro.leadIn` italic Fraunces 24px; chapter eyebrows removed; scroll hint sentence case 15px; global `.eyebrow` and `--tracking-eyebrow` removed; `DateLine.astro` removed; meta description is the sentence. RED: unit tests for the phrases and sentences failed (4 + 3) → GREEN 66/66. New e2e: sentence heading, no all-caps/tracked/“·” text anywhere visible, phrases never split across lines (hero + details) — written with the change (no e2e RED run). The hero face guard caught the lead-in wrapping at 768×1024 (fixed by dropping a 22ch cap). `npx astro check` 0 errors; content + layout + hero + palette + intro + a11y + navigation + motion: 144 passed / 24 skipped. Screenshots reviewed: 390×844 and 1440×900 hero + details.
- [ ] H5 Map facade: a palette-styled static preview (illustrated, clearly not a real map tile) with an "Abrir en Google Maps" link (opens the share URL) and a control that loads the interactive iframe in place on demand; no iframe request until asked.
- [x] H6 Copy repetition: drop the details heading "Te esperamos" (the sentence carries the facts); the closing keeps "¡Te esperamos!" without repeating the full date block. Evidence (same commit as H4): the details heading is the sentence itself; `Closing.astro` renders only "¡Te esperamos!"; the date now appears twice (hero, details) plus the link preview. e2e "says each thing once": one "te esperamos" on the page, footer text is only the farewell, no time in it.
- [ ] H7 Motion: the intro opening (with its fairy flight) is the single orchestrated moment; keep tap fairy dust and parallax; remove per-section entrance animations and ambient twinkles.
- [ ] H8 RSVP panel: WhatsApp button on one line at 360 px with the icon aligned; compact panel (no forced full-screen void) while `#confirmar` still lands with the button in view.

## Acceptance criteria

- Screenshots at 360×640, 390×844, 768×1024, 1440×900 show none of the review's issues.
- `npm test`, `npx astro check`, `npm run build`, `npm run test:e2e` pass; contrast and face-clearance guards still pass.

## Checks

`npm test` · `npx astro check` · `npm run build` · `npm run test:e2e`

## Delivery

- Work-unit commits on `feat/invitacion-artesanal` (Conventional Commits, no AI attribution). No push.
- Forecast ~500–800 authored lines; `exception-ok` (local branch).
- RDD on: per-commit `gentle-ai review assess --base-ref 87b1a03 --committed-only` (add `--untracked-scope=exclude` with the inventory hash if untracked files exist).

## Progress and evidence

- 2026-10-30: branch/worktree created from `87b1a03`.
- 2026-10-30: venue location confirmed by the user — new place: https://maps.app.goo.gl/E9QZ5DrBoGMBTAQG8 → Google "Centro de Jubilados y Pensionados 12 de Mayo - Jorge Newbery", -31.352343, -64.1810758. Display name stays "Centro de Jubilados 12 de Mayo".

## Next step

H1–H8 (delegated writer).

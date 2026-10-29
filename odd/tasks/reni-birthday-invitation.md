# Feature: reni-birthday-invitation

Locator: `odd/tasks/reni-birthday-invitation.md` · Engram mirror: `odd/reni-birthday-invitation/tasks`

## Objective

Mobile-first, fairy-themed digital invitation for Renata's first birthday, shareable by link, built with Astro and deployed to Netlify.

## Problem and why

The family needs a warm, personal invitation page that loads fast on phones (original photos are ~10 MB each), stays accessible, and keeps RSVP honest (WhatsApp only, never a fake "confirmed" state).

## Scope

- In: single static page implementing the approved prototype V3 "Inmersiva con parallax"; centralized event data; GSAP animations and parallax; Lenis smooth scroll; tsParticles fairy dust on tap; embedded Google Maps; WhatsApp template RSVP; tests; README (personalize + publish); Netlify config.
- Out: in-page RSVP form, backend, dedication or signature, music or sound, RSVP deadline.

## Design source

- Approved: V3 "Inmersiva con parallax" — artboard `project/Inmersiva.dc.html` on the Claude Design canvas https://claude.ai/artifact/Cu9czoeoZANr6yP6bhDotd (authored by the user; local copy saved by the parent in the session scratchpad and handed to the writer).
- V3 palette (from the artboard): ivory `#F6F1E7`, sand `#EDE4D3`, deep green `#2F4A36`, dark forest `#1E2A22`, ink `#2C2A24`, pink `#E7B8C0` / `#F2C9CF` / `#D8A7B1`, gold `#D8B76A` / `#B8954A`, light gold `#F3DFA6`. Fonts: Fraunces (italic, SOFT) + Nunito. Exact usage comes from the artboard; text contrast must stay ≥ 4.5:1 (≥ 3:1 for large text).
- Earlier explorations V1 (Salvia) and V2 (Bosque encantado) are not implemented.

## Constraints (requirement.md + grilling + prototype iterations)

- Stack: Astro 7 (static output), TypeScript strict, native CSS with custom-property tokens (no Tailwind).
- Motion: GSAP 3.15 + ScrollTrigger for entrance animations and parallax; Lenis 1.3 smooth scroll wired to ScrollTrigger; tsParticles 4.5 (engine + only the needed shapes/updaters/interactions, lazy-loaded on first tap) for fairy dust. Everything respects `prefers-reduced-motion` (no smooth scroll, no parallax, no particles, content visible without animation).
- Event data (do not invent): Renata · Sábado 28 de noviembre de 2026, 13:30 hs · Centro Vecinal Jorge Newbery · Maps https://maps.app.goo.gl/1j1g7EUKBxd6Cs3Q8 (resolves to -31.3519557, -64.1809048) · WhatsApp +54 9 3517 62-2809 · no RSVP deadline. Missing data becomes a clearly marked `[PLACEHOLDER]`.
- How to get there: embedded Google Maps `<iframe>` (user decision, replaces the requirement's Maps button), `loading="lazy"`, descriptive `title`. Embed source: official "Share → Embed a map" `src` if the user provides it; otherwise `https://maps.google.com/maps?q=-31.3519557,-64.1809048&z=16&hl=es&output=embed`.
- RSVP: one WhatsApp button (`wa.me`) with a predefined message containing blanks for name and number of attendees. The page never claims the RSVP was sent.
- No dedication or signature (general-public invitation). No autoplay audio. Visible copy follows the user-approved V3 verbatim (centralized in `src/data/event.ts`); V3 includes two voseo imperatives ("Deslizá para entrar al bosque", "Confirmá tu asistencia"), kept as the user's own copy and flagged for confirmation.
- Full-bleed photos; text never covers Renata's face; no boxed containers for the main feel. `noindex`; Open Graph preview (photo, name, date).
- Photos: EXIF-stripped masters in `src/assets/photos`; originals in `/images` stay on disk and are git-ignored.

## Tasks

- [x] T1 Scaffold Astro project (review and reuse the partial scaffold left by the paused run), centralized event data + copy taken from V3, link/date helpers with Vitest (test-first), EXIF-stripped photo masters. Route: delegated (writer trigger: 2+ non-trivial files). Evidence: RED observed (missing modules, then 9 failing assertions on stubs) → GREEN 14/14; `npm test` 14/14 (parent spot check re-run: 14/14); `npx astro check` 0 errors; `npm run build` exit 0. Astro 7.4.4, Vitest 5.0.5, TypeScript 6.0.3 (`@astrojs/check` 0.9.12 does not accept TS 7). Photo masters 2400 px, ~300–375 KB, EXIF and ICC removed after converting Adobe RGB (1998) → sRGB. Commit `b8dbba7`. RDD assess (base `17c47db`, committed-only, untracked `.atl/` excluded): risk medium (`executable_change` .nvmrc), `review_due: false` (`under_budget`) — pending in slice.
- [x] T2 Static page implementing V3 layout: sections, tokens, self-hosted fonts, art-directed responsive images, Google Maps iframe, SEO/OG/noindex. Route: delegated (writer trigger: 15+ new files). Evidence: `npm test` 14/14; `npx astro check` 0 errors (parent spot check re-run: 0 errors); `npm run build` exit 0; dist checks (noindex, lang es, one h1, absolute og:image via `site` from Netlify `URL`, wa.me link, iframe title + lazy, no Google Fonts CDN); headless Chrome at 360×640, 390×844, 768×1024, 1024×768, 1440×900: no horizontal overflow, nav hit areas 44×44, hero text below the face, content visible without JS. Decisions: Astro 7 Fonts API with pinned Fontsource files (Fraunces "full" for opsz+SOFT; Nunito); hero `<picture>` AVIF/WebP switching at 4/3; text-anchored scrim (alpha 0.65) + text shadow because V3 hero text over the dress measured ~1.0–1.7:1 (now ≥ 4.67:1 simulated); two-tone focus ring; 44 px side gutter for the nav. Hero portrait AVIF at 390 px: 42 KB (DPR1) / 82 KB (DPR2).
- [ ] T3 Motion per V3: GSAP entrance animations + parallax (ScrollTrigger), Lenis, tsParticles fairy dust (lazy), reduced-motion fallbacks. Route: delegated.
- [ ] T4 Playwright e2e on mobile and desktop viewports (links, anchors, no fake confirmation, reduced motion), axe accessibility, page-weight budget. Route: delegated.
- [ ] T5 README (how to personalize and publish) + `netlify.toml`. Route: delegated.
- [ ] T6 Deploy to Netlify. BLOCKED until the user explicitly authorizes the account/credentials and deploy method.

## Acceptance criteria

- Matches V3 look and flow on 360–430 px phones, tablets and desktop without horizontal scroll; touch targets ≥ 44 px; text contrast AA.
- Date, time and venue visible without hunting; the map iframe and WhatsApp button use the exact data.
- WhatsApp message prefilled with blanks for name and attendee count; no "confirmed" UI.
- With `prefers-reduced-motion: reduce`: no smooth scroll, no parallax, no particles, no entrance animations, all content visible.
- Event data editable from one file; README explains personalization and publishing.

## Checks

- `npm test` (Vitest) · `npx astro check` · `npm run build` · `npx playwright test` (from T4).

## Delivery

- Branch `feat/invitation` from the initial `main` commit; work-unit commits with Conventional Commit messages (no AI attribution, per user rule).
- Forecast: ~2000 authored changed lines. Strategy: `exception-ok` — there is no remote repository and no PR flow yet; revisit chaining if a remote is added.
- RDD: on (global). Per-commit `gentle-ai review assess` outcome recorded per task; first boundary is the initial `main` commit.

## Progress and evidence

- 2026-10-29: Grilling done; prototypes V1 (Salvia), V2 (Bosque encantado) published; user added V3 "Inmersiva con parallax" and asked to implement it with GSAP (animations + parallax) and tsParticles (fairy dust).
- Git initialized; identity set repo-locally (Matias Novillo <novillomatiasdev@gmail.com>).
- T1 was paused mid-run earlier: partial scaffold left untracked (`package.json`, `package-lock.json`, `.nvmrc`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`).

## Next step

T1 (delegated writer).

# Feature: luz-de-hadas

Locator: `odd/tasks/luz-de-hadas.md` (branch `feat/luz-de-hadas`) · Engram mirror: `odd/luz-de-hadas/tasks`

## Objective

Variant of the implemented V3 "Inmersiva con parallax" invitation that uses the user's new main photo of Renata and a warm palette derived from it ("Luz de hadas").

## Problem and why

The user wants to try a brighter, warmer look built around a new hero photo (baby on the left, misty peach/gold space on the right) without disturbing the main line of work, which another session is still changing.

## Scope

- In: new hero photo for all orientations (intro backdrop follows, since it shares the hero sources); hero copy composition that never covers the face; palette swap across tokens, components, particles and fairies; tests and docs that describe the change.
- Out: copy changes, new sections, layout changes outside the hero, deploy, push or PR.

## Constraints

- Work only in the worktree `~/www/personal/reni-birthday-worktrees/luz-de-hadas` on branch `feat/luz-de-hadas` (branched from `fff18b0` of `feat/intro-renata-fairies`). The main checkout has another session's uncommitted changes (`Closing.astro`, `RsvpPanel.astro`, `index.astro`, `e2e/layout.spec.ts`, `e2e/navigation.spec.ts`) that are NOT in this branch; expect merge conflicts there later.
- New photo source: `~/Descargas/864e2069-d720-40de-80ff-e4c167e21be3.png`, 1672×941 sRGB PNG, AI-style composite. Baby face at x≈27%, y≈38%; clean haze on the right half. Never upscale beyond 1672 px wide; it will look soft on DPR ≥ 2 phones (flagged to the user; ask for a higher-resolution file).
- Hero composition (from the canvas V4 artboard `Luz.dc.html`): portrait (< 4/3) crop around the baby (~20% 40%), copy at the bottom over a cream veil; landscape (≥ 4/3) crop ~30% 50%, copy centered in the right half over the haze with a soft radial halo; dark text on light.
- Palette "Luz de hadas" (sampled from the photo: haze `#F7E0C9`/`#F1D3BE`, dress `#F3C79D`, coral `#EBA691`, caramel `#BA7D4A`, trunk `#724920`):
  - dark warm `#3B2A27` (intro curtain, chapter screens and overlays `rgba(59,42,39,a)`, photo strips) — replaces dark forest `#1E2A22`
  - cream `#FCF4EA` (panels, light text on dark) — replaces ivory `#F6F1E7`
  - peach `#F7E2D3` (alternate panel) — replaces sand `#EDE4D3`
  - cocoa `#4E3423` (headings, body text; 10.5:1 on cream) — replaces ink `#2C2A24` and green headings
  - muted cocoa `#75594A` (secondary text; 5.9:1 on cream)
  - accent rosa profundo `#9A4A57` (name on light, hero CTA, icons, links; white text 6.1:1; hover `#7A3844`)
  - caramel `#8A5A2E` (overlines and labels on light; 4.7:1 on peach)
  - moss `#5E6A3A` (WhatsApp button; white text 5.8:1) — replaces deep green `#2F4A36` there
  - gold `#D9A462` (decor, active nav, focus ring), intro gold `#E2B66C`, light gold `#F3DFA6` (on dark)
  - coral `#EBA691` / light coral `#F5CDBF` (particles, butterflies; intro name on dark) — replace the pinks
- Keep every text pairing ≥ 4.5:1 (≥ 3:1 for large text), measured, not assumed. Reduced motion, no horizontal overflow and 44 px targets stay as they are.

## Tasks

- [x] L1 Hero photo: EXIF-free sRGB master `src/assets/photos/hero-fairy.jpg` from the new PNG; use it as the hero for portrait and landscape; hero copy composition per the constraints; intro backdrop follows; tests updated. Route: delegated (preparation reading + several files). Evidence: master 1672×941 RGB progressive JPEG q86, no EXIF/ICC, 226 KB (source PNG had no ICC → treated as sRGB; SHA-256 unchanged); renditions 640/960/1280/1672 w shared by both orientations (AVIF 1672 = 72 KB), no build-time crop, no upscaling; `hero-portrait.jpg`/`hero-landscape.jpg` kept (photo band still uses them); link preview now cropped from the new photo. Composition: portrait 20% 40% with the copy at the bottom over a text-anchored cream veil (eased 80 px fade, 0.86 → 0.94 → solid); the photo is lifted inside its picture (`--hero-lift`, CSS only, capped so the headband stays ≥ 8 px from the top under the 1.14 zoom) because a landscape photo on a portrait screen puts the chin at 56% of the height and the phone copy stack needs ~45–60%; short phones (≤ 700 px tall) get a tighter stack and a 12.5svh name. Landscape 30% 50% with the copy centered in the right half over the V4 radial halo plus a blurred cream cushion behind the stack. Dark copy: eyebrow caramel, name accent, date cocoa, CTA accent pill (white 6.0:1), hint muted cocoa. Twinkles moved off the face. T3b check: the 1.06 landscape zoom is no longer needed for the headband (new photo has headroom) but kept as the approved subtler motion; the old top crops and 18svh landscape cap were removed. Test-first: new `e2e/hero.spec.ts` (face box measured on the master, projected from the rendered img; 6 acceptance + 5 guard viewports; widest rendition ≤ 1672) — RED on the old photo (srcset 2400w > 1672 in mobile/desktop/desktop-reduced-motion), RED after swapping only the photo (360×640: eyebrow over the face), GREEN after the composition. Face clearance (motion / reduced, min gap face→text, px): 360×640 25/18, 390×844 50/41, 768×1024 38/41, 1024×768 194/186, 1280×800 305/294, 1440×900 367/355; guards 375×667 23/18, 360×780 40/29, 412×915 99/94, 820×1180 34/41, 844×390 141/134. Contrast over the photo (5th percentile of the pixels behind the text, text hidden, 10 viewports, motion and reduced): hero eyebrow 4.92, name 4.95 (large), date 9.22, hint 4.83; intro (still the forest tint) eyebrow 4.71, name 5.44. Mobile weight 483,140 B (budget 903,922 B); initial JS 53.0 KB gzip. Checks: `npm test` 58/58; `npx astro check` 0 errors; `npm run build` ok; `npm run test:e2e` 146 passed / 46 skipped.
  L1 commit `c1ebef3`; RDD assess (base `fff18b0`, committed-only): medium, `review_due: false` (`under_budget`).
- [x] L2 Palette "Luz de hadas" across tokens, components, particles, fairies, theme color and favicon if themed; contrast assertions updated; README notes. Route: delegated (same writer). Evidence: tokens renamed to the palette (dark, cream, peach, cocoa, cocoa-muted, caramel, accent/hover, moss, gold, gold-intro, gold-light, coral, coral-light; tints dark/cream/accent/moss/gold) and every V3 token removed (no undefined or stale token left); panels cream/peach (`sheet--cream`/`sheet--peach`), headings and body cocoa, detail labels caramel, detail icons accent on cream, links accent (hover `#7A3844`), closing heading accent, WhatsApp moss, side nav cream dashes with a warm shadow, intro curtain/chapters/photo band/page background dark warm, intro star and eyebrow `#E2B66C`, intro name light coral, particles gold/light gold/light coral with coral butterfly lower wings, fairies recolored (wings light coral/coral, gold strokes, cream head), `theme-color` and favicon `#3B2A27` + `#E2B66C`. Focus ring stays two-tone: gold inside, cocoa outside (gold alone is 2.04:1 on cream). Deviations needed for AA (measured, not assumed): the warm tint is lighter than V3's forest, so the chapter scrim went 0.65 → 0.75 (eyebrow 4.13 → 5.35 worst) and the intro shade became 60% uniform + a flat 80% ellipse behind the text (intro eyebrow 3.77 → 5.85 worst). Solid pairings (e2e/palette.spec.ts): cocoa/cream 10.47, cocoa/peach 9.12, muted/cream 5.87, muted/peach 5.11, caramel/cream 5.38, caramel/peach 4.68, accent/cream 5.52, accent/peach 4.80, white/accent 6.02, white/accent-hover 8.48, white/moss 5.84, dark/cream 12.46, light gold/dark 10.29, intro gold/dark 7.20, light coral/dark 9.29, focus cocoa/cream 10.47, gold/dark 6.10. Over photos (5th percentile, 10 viewports, motion and reduced): intro eyebrow 5.85, intro name 7.37; hero eyebrow 4.92, name 4.95, date 9.22, hint 4.97; chapter II eyebrow 5.35, title 7.48; chapter III eyebrow 6.60, title 7.63. Test-first: `burst.test.ts` palette colors and new `e2e/palette.spec.ts` RED on the V3 palette (burst used `#D8B76A`/`#E7B8C0`; `--color-peach` undefined) → GREEN. README: colors section. Checks: `npm test` 58/58; `npx astro check` 0 errors; `npm run build` ok; `npm run test:e2e` 147 passed / 51 skipped.

## Acceptance criteria

- The face is never covered at 360×640, 390×844, 768×1024, 1024×768, 1280×800 and 1440×900.
- All text pairings AA as listed; no horizontal overflow; reduced motion unchanged.
- No image is served wider than its 1672 px source.
- `npm test`, `npx astro check`, `npm run build` and `npm run test:e2e` pass.

## Checks

`npm test` · `npx astro check` · `npm run build` · `npm run test:e2e`

## Delivery

- Work-unit commits on `feat/luz-de-hadas` (Conventional Commits, no AI attribution). No push, PR or merge without the user.
- Forecast ~300–500 authored lines; strategy `exception-ok` (local branch, no remote flow).
- RDD on (global): per-commit `gentle-ai review assess` with base `fff18b0`, committed-only.

## Progress and evidence

- 2026-10-30: Worktree and branch created from `fff18b0`. Canvas V4 artboard `Luz.dc.html` published as the visual reference.
- 2026-10-30: L1 and L2 done by the delegated writer (one work-unit commit each). The L2 commit hash is reported in the handoff (a commit cannot record its own hash).
- Known: the hero photo is 1672 px wide and looks soft on DPR ≥ 2 phones (needs a higher-resolution export of the same image); the portrait lift relies on copy-height estimates (`--hero-copy-fixed`), guarded by `e2e/hero.spec.ts` on 11 viewports.

## Next step

Parent review (screenshots, RDD assess of the L2 commit), then the user decides on merge into the main line.

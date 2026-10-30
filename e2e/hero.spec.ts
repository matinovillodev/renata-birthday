import type { Page } from '@playwright/test';
import { expect, openInvitation, test } from './fixtures';

/**
 * Hero photo checks ("Luz de hadas" photo, src/assets/photos/hero-fairy.jpg).
 *
 * The face box is measured on the 1672x941 master (headband top to chin,
 * cheek to cheek) and projected onto the screen from the rendered `<img>`:
 * its box (including the parallax transform), natural size, `object-fit:
 * cover` and `object-position`. Renditions are never cropped at build time.
 */
const MASTER = { width: 1672, height: 941 };
const FACE = { left: 0.19, top: 0.235, right: 0.35, bottom: 0.56 };

/**
 * Acceptance viewports (feature doc `odd/tasks/luz-de-hadas.md`), then common
 * phones and tablets that stress the portrait lift (Hero.astro) and a rotated phone.
 */
const VIEWPORTS = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 375, height: 667 },
  { width: 360, height: 780 },
  { width: 412, height: 915 },
  { width: 820, height: 1180 },
  { width: 844, height: 390 },
];

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Face box and the boxes of the hero copy (text runs and the button), in viewport px. */
function measure(page: Page, face: Box) {
  return page.evaluate((faceBox) => {
    const img = document.querySelector<HTMLImageElement>('#inicio [data-parallax="photo"] img');
    if (!img) throw new Error('hero image not found');
    const rect = img.getBoundingClientRect();
    const scale = Math.max(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    const drawnWidth = img.naturalWidth * scale;
    const drawnHeight = img.naturalHeight * scale;
    const [posX = '50%', posY = '50%'] = getComputedStyle(img).objectPosition.split(' ');
    const offset = (position: string, free: number) =>
      position.endsWith('%') ? (free * parseFloat(position)) / 100 : parseFloat(position);
    const left = rect.left + offset(posX, rect.width - drawnWidth);
    const top = rect.top + offset(posY, rect.height - drawnHeight);
    const round = (value: number) => Math.round(value * 10) / 10;
    const faceOnScreen = {
      left: round(left + faceBox.left * drawnWidth),
      top: round(top + faceBox.top * drawnHeight),
      right: round(left + faceBox.right * drawnWidth),
      bottom: round(top + faceBox.bottom * drawnHeight),
    };

    const copy = [...document.querySelectorAll<HTMLElement>('#inicio [data-rise] > *')].map((element) => {
      let box: DOMRect;
      if (element.matches('a, button')) {
        box = element.getBoundingClientRect();
      } else {
        // Tight box of the text itself (the paragraph boxes span the full width).
        const range = document.createRange();
        range.selectNodeContents(element);
        box = range.getBoundingClientRect();
      }
      return {
        name: element.className || element.tagName,
        left: round(box.left),
        top: round(box.top),
        right: round(box.right),
        bottom: round(box.bottom),
      };
    });
    return { face: faceOnScreen, copy, viewport: { width: innerWidth, height: innerHeight } };
  }, face);
}

const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

test('the hero copy never covers Renata\'s face, which stays fully on screen', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'), 'the viewports are set per test (desktop projects only)');

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await openInvitation(page);
    await expect
      .poll(() => page.locator('#inicio [data-parallax="photo"] img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);

    const { face, copy } = await measure(page, FACE);
    const label = `${viewport.width}x${viewport.height}`;
    const clearance = copy.map((box) => {
      // Gap between the face and this text box: vertical when it is below, horizontal when beside.
      const below = box.top - face.bottom;
      const beside = box.left - face.right;
      return { name: box.name, gap: Math.round(Math.max(below, beside)) };
    });
    testInfo.annotations.push({
      type: `hero ${label}`,
      description: `face ${JSON.stringify(face)}; gaps ${clearance.map(({ name, gap }) => `${name}: ${gap}px`).join(', ')}`,
    });

    expect(face.top, `${label}: headband below the top edge`).toBeGreaterThanOrEqual(0);
    expect(face.left, `${label}: face right of the left edge`).toBeGreaterThanOrEqual(0);
    expect(face.right, `${label}: face left of the right edge`).toBeLessThanOrEqual(viewport.width);
    expect(face.bottom, `${label}: chin above the bottom edge`).toBeLessThanOrEqual(viewport.height);
    for (const box of copy) {
      expect(overlaps(face, box), `${label}: "${box.name}" ${JSON.stringify(box)} covers the face ${JSON.stringify(face)}`).toBe(false);
    }
  }
});

test('the hero never serves a rendition wider than its 1672 px master', async ({ page }) => {
  await page.goto('/');
  const widths = await page.locator('#inicio [data-parallax="photo"]').evaluate((picture) =>
    [...picture.querySelectorAll('source')].flatMap((source) =>
      source.srcset.split(',').map((candidate) => Number(candidate.trim().split(' ')[1]?.replace('w', ''))),
    ),
  );
  expect(widths.length).toBeGreaterThan(0);
  expect(Math.max(...widths), 'widest srcset candidate').toBeLessThanOrEqual(MASTER.width);

  const fallbackWidth = await page.locator('#inicio [data-parallax="photo"] img').getAttribute('width');
  expect(Number(fallbackWidth)).toBeLessThanOrEqual(MASTER.width);

  await expect
    .poll(() => page.locator('#inicio [data-parallax="photo"] img').evaluate((img: HTMLImageElement) => (img.complete ? img.naturalWidth : 0)))
    .toBeGreaterThan(0);
  // `naturalWidth` of a srcset image is density-corrected; decode the chosen file on its own to read its pixels.
  const served = await page.locator('#inicio [data-parallax="photo"] img').evaluate(async (img: HTMLImageElement) => {
    const probe = new Image();
    probe.src = img.currentSrc;
    await probe.decode();
    return probe.naturalWidth;
  });
  expect(served, 'downloaded hero width in pixels').toBeLessThanOrEqual(MASTER.width);
});

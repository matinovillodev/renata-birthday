import type { Page, TestInfo } from '@playwright/test';
import { expect, openInvitation, reducesMotion, tapAt, test } from './fixtures';

/** Taps over the invitation text and reports whether the particle chunk was requested. */
async function tapOnInvitation(page: Page, testInfo: TestInfo): Promise<() => boolean> {
  let requested = false;
  page.on('request', (request) => {
    if (/\/engine\.[\w-]+\.js$/.test(request.url())) requested = true;
  });
  await page.locator('#invitacion').scrollIntoViewIfNeeded();
  const box = await page.locator('#invitacion h2').boundingBox();
  if (!box) throw new Error('#invitacion heading is not rendered');
  await tapAt(page, testInfo, box.x + box.width / 2, box.y + box.height / 2);
  return () => requested;
}

test.describe('with reduced motion', () => {
  test.beforeEach(({}, testInfo) => test.skip(!reducesMotion(testInfo), 'reduced-motion projects only'));

  test('keeps native scrolling, static photos and fully visible content', async ({ page }) => {
    await page.goto('/');
    await openInvitation(page);

    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
    const transforms = await page.locator('[data-parallax="photo"]').evaluateAll((photos) =>
      photos.map((photo) => getComputedStyle(photo).transform),
    );
    expect(transforms.every((transform) => transform === 'none')).toBe(true);

    const hidden = await page
      .locator('[data-rise] > *, [data-parallax="float"], .sheet > *')
      .evaluateAll((elements) =>
        elements.filter((el) => getComputedStyle(el).opacity !== '1').map((el) => el.textContent?.trim().slice(0, 40)),
      );
    expect(hidden).toEqual([]);
  });

  test('a tap draws no fairy dust and loads no particle engine', async ({ page }, testInfo) => {
    await page.goto('/');
    await openInvitation(page);
    const engineRequested = await tapOnInvitation(page, testInfo);

    // Let any pending pointer handling and dynamic import start.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForLoadState('networkidle');

    expect(engineRequested()).toBe(false);
    await expect(page.locator('[data-fairy-dust] canvas')).toHaveCount(0);
  });
});

test.describe('with motion allowed', () => {
  test.beforeEach(({}, testInfo) => test.skip(reducesMotion(testInfo), 'motion projects only'));

  test('runs Lenis and parallax', async ({ page }) => {
    await page.goto('/');
    await openInvitation(page);

    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    await expect
      .poll(() => page.locator('[data-parallax="photo"]').first().evaluate((photo) => getComputedStyle(photo).transform))
      .not.toBe('none');
  });

  test('a tap creates the fairy-dust canvas', async ({ page }, testInfo) => {
    await page.goto('/');
    await openInvitation(page);
    await tapOnInvitation(page, testInfo);

    await expect(page.locator('[data-fairy-dust] canvas')).toHaveCount(1);
  });
});

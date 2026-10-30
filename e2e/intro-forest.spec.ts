import type { TestInfo } from '@playwright/test';
import { expect, reducesMotion, test, waitForScript } from './fixtures';

/** Projects whose intro screenshots the parent reviews. */
const SCREENSHOT_PROJECTS = new Set(['small', 'mobile', 'desktop']);

function isLandscape(testInfo: TestInfo): boolean {
  const viewport = testInfo.project.use.viewport;
  return !!viewport && viewport.width / viewport.height >= 4 / 3;
}

/** Waits until two animation frames have passed (lets CSS/GSAP apply styles). */
const twoFrames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await waitForScript(page);
});

test('the forest background behind the intro loads', async ({ page }) => {
  const photo = page.locator('[data-intro-bg] img');
  await expect(photo).toBeVisible();
  await expect
    .poll(() => photo.evaluate((img: HTMLImageElement) => (img.complete ? img.naturalWidth : 0)))
    .toBeGreaterThan(0);
});

test('landscape screens add the blurred fill layer; portrait screens do not', async ({ page }, testInfo) => {
  const fill = page.locator('[data-intro-fill]');
  if (!isLandscape(testInfo)) {
    await expect(fill).toBeHidden();
    return;
  }
  await expect(fill).toBeVisible();
  await expect(fill.locator('img')).toHaveCSS('filter', /blur\(28px\)/);
});

test.describe('with reduced motion', () => {
  test.beforeEach(({}, testInfo) => test.skip(!reducesMotion(testInfo), 'reduced-motion projects only'));

  test('the background is static and there are no fireflies', async ({ page }) => {
    await page.evaluate(twoFrames);
    await expect(page.locator('[data-intro-camera]')).toHaveCSS('transform', 'none');
    await expect(page.locator('[data-intro-fireflies]')).toBeHidden();
    const running = await page
      .locator('[data-intro-fireflies]')
      .evaluate((el) => el.getAnimations({ subtree: true }).length);
    expect(running).toBe(0);
  });
});

test.describe('with motion allowed', () => {
  test.beforeEach(({}, testInfo) => test.skip(reducesMotion(testInfo), 'motion projects only'));

  test('the background slowly zooms and the fireflies glow', async ({ page }) => {
    await expect
      .poll(() =>
        page.locator('[data-intro-camera]').evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a),
      )
      .toBeGreaterThan(1);
    await expect(page.locator('[data-intro-fireflies]')).toBeVisible();
    const running = await page
      .locator('[data-intro-fireflies]')
      .evaluate((el) => el.getAnimations({ subtree: true }).length);
    expect(running).toBeGreaterThan(0);
  });
});

test('intro screenshot and image bytes for review', async ({ page }, testInfo) => {
  test.skip(!SCREENSHOT_PROJECTS.has(testInfo.project.name), 'screenshots only for small, mobile and desktop');

  await expect(page.getByRole('button', { name: 'Abrir invitación' })).toHaveCSS('opacity', '1');
  await expect
    .poll(() => page.locator('[data-intro-bg] img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);

  const forest = await page.evaluate(() =>
    (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
      .filter((entry) => entry.name.includes('intro-forest'))
      .map((entry) => `${new URL(entry.name).pathname.split('/').pop()} ${entry.transferSize} B`),
  );
  testInfo.annotations.push({ type: 'intro image', description: forest.join(', ') });
  console.log(`[${testInfo.project.name}] intro image requests:`, forest.join(', '));
  expect(forest, 'the sharp and blurred layers share one download').toHaveLength(1);

  await page.screenshot({ path: testInfo.outputPath('intro.png') });
});

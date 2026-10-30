import type { Page } from '@playwright/test';
import { expect, reducesMotion, test, waitForScript } from './fixtures';

/** Projects whose intro screenshots the parent reviews. */
const SCREENSHOT_PROJECTS = new Set(['small', 'mobile', 'desktop']);

/** Resolves after `count` animation frames (lets CSS/GSAP apply styles). */
const frames = (page: Page, count: number) =>
  page.evaluate(
    (n) =>
      new Promise<void>((resolve) => {
        const step = (left: number) => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
        step(n);
      }),
    count,
  );

const cameraScale = (page: Page) =>
  page.locator('[data-intro-camera]').evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await waitForScript(page);
});

test('the blurred hero copy behind the intro loads', async ({ page }) => {
  const photo = page.locator('[data-intro-bg] img');
  await expect(photo).toBeVisible();
  await expect
    .poll(() => photo.evaluate((img: HTMLImageElement) => (img.complete ? img.naturalWidth : 0)))
    .toBeGreaterThan(0);
  await expect(photo).toHaveCSS('filter', /blur\(28px\)/);
});

test('the intro copy uses the hero photo renditions, downloaded once', async ({ page }, testInfo) => {
  const describe = (selector: string) =>
    page.locator(selector).evaluate((picture) => ({
      sources: [...picture.querySelectorAll('source')].map((s) => [s.media, s.type, s.srcset, s.sizes]),
      img: picture.querySelector('img')?.getAttribute('src'),
    }));
  const hero = await describe('#inicio [data-parallax="photo"]');
  expect(await describe('[data-hero-copy]')).toEqual(hero);

  await expect
    .poll(() => page.locator('[data-hero-copy] img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  const candidates = new Set(
    hero.sources.flatMap(([, , srcset]) => srcset.split(',').map((entry) => entry.trim().split(' ')[0])).concat(hero.img ?? []),
  );
  const downloads = await page.evaluate(
    (urls) =>
      (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
        .map((entry) => ({ path: new URL(entry.name).pathname, bytes: entry.transferSize }))
        .filter(({ path }) => urls.includes(path)),
    [...candidates],
  );
  const summary = downloads.map(({ path, bytes }) => `${path.split('/').pop()} ${bytes} B`).join(', ');
  testInfo.annotations.push({ type: 'hero image (shared with intro)', description: summary });
  console.log(`[${testInfo.project.name}] hero image (shared with intro): ${summary}`);
  expect(downloads, 'hero renditions requested').toHaveLength(1);
});

test.describe('with reduced motion', () => {
  test.beforeEach(({}, testInfo) => test.skip(!reducesMotion(testInfo), 'reduced-motion projects only'));

  test('the blurred background is static and there are no fireflies', async ({ page }) => {
    const before = await cameraScale(page);
    await frames(page, 20);
    expect(await cameraScale(page)).toBe(before);
    await expect(page.locator('[data-intro-fireflies]')).toBeHidden();
    const running = await page
      .locator('[data-intro-fireflies]')
      .evaluate((el) => el.getAnimations({ subtree: true }).length);
    expect(running).toBe(0);
  });
});

test.describe('with motion allowed', () => {
  test.beforeEach(({}, testInfo) => test.skip(reducesMotion(testInfo), 'motion projects only'));

  test('the blurred background slowly zooms and the fireflies glow', async ({ page }) => {
    const start = await cameraScale(page);
    await expect.poll(() => cameraScale(page)).toBeGreaterThan(start);
    await expect(page.locator('[data-intro-fireflies]')).toBeVisible();
    const running = await page
      .locator('[data-intro-fireflies]')
      .evaluate((el) => el.getAnimations({ subtree: true }).length);
    expect(running).toBeGreaterThan(0);
  });

  test('opening pulls focus onto the sharp hero, aligned with it', async ({ page }) => {
    await page.getByRole('button', { name: 'Abrir invitación' }).click();
    await expect(page.locator('[data-intro]')).toBeHidden();

    // The hidden curtain computes `transform: none`, so read the final scale GSAP
    // left inline on the blurred copy and compare it with the sharp hero's.
    const [copyScale, heroScale] = await page.evaluate(() => [
      new DOMMatrixReadOnly((document.querySelector('[data-intro-camera]') as HTMLElement).style.transform).a,
      new DOMMatrixReadOnly(getComputedStyle(document.querySelector('#inicio [data-parallax="photo"]')!).transform).a,
    ]);
    expect(heroScale).toBeGreaterThan(1);
    expect(Math.abs(copyScale - heroScale), 'blurred copy matches the hero scale at reveal').toBeLessThan(0.005);
  });
});

test('intro screenshot for review', async ({ page }, testInfo) => {
  test.skip(!SCREENSHOT_PROJECTS.has(testInfo.project.name), 'screenshots only for small, mobile and desktop');

  await expect(page.getByRole('button', { name: 'Abrir invitación' })).toHaveCSS('opacity', '1');
  await expect
    .poll(() => page.locator('[data-intro-bg] img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  await page.screenshot({ path: testInfo.outputPath('intro.png') });
});

import { copy } from '../src/data/event';
import { expect, openInvitation, test, topOf } from './fixtures';

/** Projects whose screenshots the parent reviews for face clearance. */
const SCREENSHOT_PROJECTS = new Set(['small', 'tablet-landscape']);

test('no horizontal overflow anywhere on the page', async ({ page }) => {
  await page.goto('/');
  await openInvitation(page);

  for (const { id } of copy.nav.items) {
    await page.evaluate((target) => document.getElementById(target)?.scrollIntoView({ behavior: 'instant' }), id);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `horizontal overflow at #${id}`).toBe(0);
  }
});

test('screenshots for face-clearance review', async ({ page }, testInfo) => {
  test.skip(!SCREENSHOT_PROJECTS.has(testInfo.project.name), 'screenshots only for small and tablet-landscape');

  await page.goto('/');
  await openInvitation(page);
  await expect(page.locator('[data-rise] > *').last()).toHaveCSS('opacity', '1');
  await page.screenshot({ path: testInfo.outputPath('viewport-inicio.png') });

  for (const { id } of copy.nav.items.slice(1)) {
    await page.evaluate((target) => document.getElementById(target)?.scrollIntoView({ behavior: 'instant' }), id);
    await expect.poll(() => topOf(page, id)).toBeLessThanOrEqual(2);
    // Wait for the lazy photos in view to load and the sheet content in view to finish revealing.
    await page.waitForFunction(() => {
      const inView = (el: Element) => {
        const rect = el.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
      };
      return (
        [...document.images].filter(inView).every((img) => img.complete) &&
        [...document.querySelectorAll('.sheet > *')].filter(inView).every((el) => getComputedStyle(el).opacity === '1')
      );
    });
    await page.screenshot({ path: testInfo.outputPath(`viewport-${id}.png`) });
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: testInfo.outputPath('full-page.png'), fullPage: true });
});

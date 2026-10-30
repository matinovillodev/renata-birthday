import { expect, reducesMotion, test, waitForScript } from './fixtures';

/** Projects whose mid-flight screenshots the parent reviews. */
const SCREENSHOT_PROJECTS = new Set(['mobile', 'desktop']);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await waitForScript(page);
});

test.describe('with motion allowed', () => {
  test.beforeEach(({}, testInfo) => test.skip(reducesMotion(testInfo), 'motion projects only'));

  test('three fairies fly out on opening, never block the page, and are removed', async ({ page }, testInfo) => {
    const fairies = page.locator('[data-fairies] [data-fairy]');
    await expect(fairies).toHaveCount(0);

    await page.getByRole('button', { name: 'Abrir invitación' }).click();
    await expect(fairies).toHaveCount(3);

    // Mid-flight: every fairy visible and away from where it started.
    await expect
      .poll(() =>
        fairies.evaluateAll((nodes) =>
          nodes.every((node) => {
            const style = getComputedStyle(node);
            const box = node.getBoundingClientRect();
            return Number(style.opacity) > 0.9 && box.width > 0;
          }),
        ),
      )
      .toBe(true);

    // Decorative: pointer events pass through to the page underneath.
    const hit = await fairies.first().evaluate((node) => {
      const box = node.getBoundingClientRect();
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return top?.closest('[data-fairies]') !== null && top !== null;
    });
    expect(hit, 'the fairy layer never receives pointer events').toBe(false);
    await expect(page.locator('[data-fairies]')).toHaveCSS('pointer-events', 'none');

    if (SCREENSHOT_PROJECTS.has(testInfo.project.name)) {
      await page.screenshot({ path: testInfo.outputPath('fairies-mid-flight.png') });
    }

    // Removed after the flight (longest flight: 0.36 s delay + 2.8 s).
    await expect(fairies).toHaveCount(0, { timeout: 8_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  });
});

test.describe('with reduced motion', () => {
  test.beforeEach(({}, testInfo) => test.skip(!reducesMotion(testInfo), 'reduced-motion projects only'));

  test('no fairies fly when the invitation opens', async ({ page }) => {
    await page.getByRole('button', { name: 'Abrir invitación' }).click();
    await expect(page.locator('[data-intro]')).toBeHidden();
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-fairies] [data-fairy]')).toHaveCount(0);
  });
});

test('a deep link shows no fairies', async ({ page }) => {
  await page.goto('/#confirmar');
  await waitForScript(page);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-fairies] [data-fairy]')).toHaveCount(0);
});

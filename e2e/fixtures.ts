import { test as base, expect, type Page, type TestInfo } from '@playwright/test';

/**
 * Shared test setup:
 * - every request outside the local preview server (Google Maps embed,
 *   wa.me) gets a tiny stub page, so tests are deterministic and offline;
 * - any first-party console error or uncaught page error fails the test.
 */
export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ page, context, baseURL }, use) => {
      const origin = new URL(baseURL ?? 'http://127.0.0.1').origin;
      await context.route(
        (url) => url.origin !== origin,
        (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>stub</title>' }),
      );

      const problems: string[] = [];
      page.on('console', (message) => {
        const source = message.location().url;
        if (message.type() === 'error' && (!source || source.startsWith(origin))) {
          problems.push(`console.error: ${message.text()}`);
        }
      });
      page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));

      await use();

      expect(problems, 'first-party console errors and page errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** True in the projects that emulate `prefers-reduced-motion: reduce`. */
export function reducesMotion(testInfo: TestInfo): boolean {
  return testInfo.project.use.reducedMotion === 'reduce';
}

/** Waits until the motion layer has taken over the page (main.ts finished). */
export async function waitForScript(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'ready');
}

/**
 * Opens the "Abrir invitación" curtain (if shown), then waits until it is gone
 * and the hero text has finished rising. Clicking hero links while they still
 * move makes Playwright's scroll-into-view retries scroll the page, and the
 * next sheet then covers the sticky hero.
 */
export async function openInvitation(page: Page): Promise<void> {
  await waitForScript(page);
  const button = page.getByRole('button', { name: 'Abrir invitación' });
  if (await button.isVisible()) {
    await button.click();
  }
  await expect(page.locator('html')).not.toHaveClass(/\bintro\b/);
  await expect(page.locator('[inert]')).toHaveCount(0);
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-rise] > *')].every((el) => {
      const style = getComputedStyle(el);
      return style.opacity === '1' && (style.transform === 'none' || style.transform === 'matrix(1, 0, 0, 1, 0, 0)');
    }),
  );
}

/** Viewport-relative top of an element, rounded (0 when it sits at the top). */
export function topOf(page: Page, id: string): Promise<number> {
  return page.evaluate((elementId) => {
    const element = document.getElementById(elementId);
    return element ? Math.abs(Math.round(element.getBoundingClientRect().top)) : Number.NaN;
  }, id);
}

/** Taps (touch projects) or clicks (mouse projects) at viewport coordinates. */
export async function tapAt(page: Page, testInfo: TestInfo, x: number, y: number): Promise<void> {
  if (testInfo.project.use.hasTouch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

import { copy, event } from '../src/data/event';
import { formatEventDate } from '../src/lib/event-date';
import { expect, openInvitation, test, topOf } from './fixtures';

/** Projects whose screenshots the parent reviews for face clearance (desktop = 1440x900). */
const SCREENSHOT_PROJECTS = new Set(['small', 'tablet-landscape', 'desktop']);

test('the date line never leaves the "·" separator at the end of a line', async ({ page }) => {
  const { timeLabel } = formatEventDate(event.startsAt, event.timeZone);
  const separator = copy.dateTimeSeparator.trim();
  await page.goto('/');
  await openInvitation(page);

  const lines = await page.locator('p', { hasText: timeLabel }).evaluateAll(
    (paragraphs, [sep, time]) =>
      paragraphs.map((p) => {
        // Viewport top of the first occurrence of `text` inside `p`.
        const topOf = (text: string) => {
          const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const index = node.textContent?.indexOf(text) ?? -1;
            if (index < 0) continue;
            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + 1);
            return Math.round(range.getBoundingClientRect().top);
          }
          return Number.NaN;
        };
        return { text: p.textContent?.trim(), separatorTop: topOf(sep), timeTop: topOf(time) };
      }),
    [separator, timeLabel] as const,
  );

  expect(lines.length, 'hero and closing date lines').toBeGreaterThanOrEqual(2);
  for (const line of lines) {
    expect(line.separatorTop, `"${separator}" sits on the same line as the time in "${line.text}"`).toBe(line.timeTop);
  }
});

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
  test.skip(!SCREENSHOT_PROJECTS.has(testInfo.project.name), 'screenshots only for small, tablet-landscape and desktop');

  await page.goto('/');
  await openInvitation(page);
  await expect(page.locator('[data-rise] > *').last()).toHaveCSS('opacity', '1');
  await page.screenshot({ path: testInfo.outputPath('viewport-inicio.png') });

  for (const { id } of copy.nav.items.slice(1)) {
    // Re-issue the jump until it sticks: a late ScrollTrigger refresh or Lenis
    // frame can land right after a single native jump on a busy machine.
    await expect
      .poll(async () => {
        await page.evaluate((target) => document.getElementById(target)?.scrollIntoView({ behavior: 'instant' }), id);
        return topOf(page, id);
      })
      .toBeLessThanOrEqual(2);
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

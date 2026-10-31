import { copy, event } from '../src/data/event';
import { formatEventDate } from '../src/lib/event-date';
import { expect, openInvitation, test, topOf } from './fixtures';

/** Projects whose screenshots the parent reviews for face clearance (desktop = 1440x900). */
const SCREENSHOT_PROJECTS = new Set(['small', 'tablet-landscape', 'desktop']);

test('a date phrase ("28 de noviembre", "a las 13:30") never splits across lines', async ({ page }) => {
  const date = formatEventDate(event.startsAt, event.timeZone);
  await page.goto('/');
  await openInvitation(page);
  await page.evaluate(() => document.fonts.ready);

  const phrases = [date.date, date.time];
  const report = await page.locator('#inicio .hero__date, #el-gran-dia h2').evaluateAll(
    (elements, wanted) =>
      elements.flatMap((element) => {
        // The text uses no-break spaces inside each phrase; compare with plain spaces.
        const node = [...element.childNodes].find((child) => child.nodeType === Node.TEXT_NODE);
        const text = node?.textContent ?? '';
        return wanted.map((phrase) => {
          const index = text.replaceAll('\u00A0', ' ').indexOf(phrase);
          if (!node || index < 0) return { phrase, lines: 0 };
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + phrase.length);
          const tops = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top)));
          return { phrase, lines: tops.size };
        });
      }),
    phrases,
  );

  expect(report).toHaveLength(4);
  for (const { phrase, lines } of report) expect(lines, `"${phrase}" on a single line`).toBe(1);
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

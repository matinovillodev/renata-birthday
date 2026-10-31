import type { Locator, Page } from '@playwright/test';
import { copy } from '../src/data/event';
import { expect, openInvitation, reachedSection, test, waitForScript } from './fixtures';

/** Waits until `locator` is entirely inside the viewport (scrolling may still be easing). */
async function expectFullyInViewport(locator: Locator, what: string): Promise<void> {
  await expect
    .poll(
      () =>
        locator.evaluate((el) => {
          const box = el.getBoundingClientRect();
          return box.top >= 0 && box.left >= 0 && box.bottom <= innerHeight && box.right <= innerWidth;
        }),
      { message: `${what} is fully inside the viewport` },
    )
    .toBe(true);
}

const whatsappButton = (page: Page) => page.getByRole('link', { name: copy.rsvp.button });

test.describe('from the opened invitation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await openInvitation(page);
  });

  test('the hero call to action reaches the RSVP chapter', async ({ page }) => {
    await page.getByRole('link', { name: copy.hero.rsvpButton }).click();

    await expect.poll(() => reachedSection(page, 'confirmar')).toBe(true);
    await expect(page).toHaveURL(/#confirmar$/);
    await expect(page.locator('[data-nav-link="confirmar"]')).toHaveAttribute('aria-current', 'true');
  });

  test('the hero call to action lands on the WhatsApp button', async ({ page }) => {
    await page.getByRole('link', { name: copy.hero.rsvpButton }).click();

    await expectFullyInViewport(whatsappButton(page), 'the WhatsApp button');
  });

  test('the side-nav "Confirmar" link lands on the WhatsApp button', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: copy.nav.ariaLabel });
    await nav.getByRole('link', { name: 'Confirmar' }).click();

    await expectFullyInViewport(whatsappButton(page), 'the WhatsApp button');
    await expect(nav.locator('[data-nav-link="confirmar"]')).toHaveAttribute('aria-current', 'true');
  });

  test('every side-nav link reaches its section and becomes the current one', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: copy.nav.ariaLabel });
    // Bottom-up, so every jump actually scrolls.
    for (const item of [...copy.nav.items].reverse()) {
      await nav.getByRole('link', { name: item.label }).click();

      await expect.poll(() => reachedSection(page, item.id), { message: `#${item.id} is reached` }).toBe(true);
      await expect(nav.locator(`[data-nav-link="${item.id}"]`)).toHaveAttribute('aria-current', 'true');
      await expect(nav.locator('[aria-current="true"]')).toHaveCount(1);
    }
  });
});

test.describe('the RSVP panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#confirmar');
    await waitForScript(page);
    await page.evaluate(() => document.fonts.ready);
  });

  test('keeps "Confirmar por WhatsApp" on one line, its icon centered on the text', async ({ page }) => {
    const layout = await whatsappButton(page).evaluate((link) => {
      const icon = link.querySelector('svg')!.getBoundingClientRect();
      const text = [...link.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      const range = document.createRange();
      range.selectNodeContents(text!);
      const lines = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
      const box = range.getBoundingClientRect();
      return {
        lines,
        height: Math.round(link.getBoundingClientRect().height),
        offset: Math.abs(icon.top + icon.height / 2 - (box.top + box.height / 2)),
      };
    });
    expect(layout.lines, 'label lines').toBe(1);
    expect(layout.height, 'button height').toBeLessThanOrEqual(58);
    expect(layout.offset, 'icon vs text vertical centers (px)').toBeLessThanOrEqual(2);
  });

  test('is compact: no forced empty space between the button and the farewell', async ({ page }) => {
    const gap = await page.evaluate(() => {
      const button = document.querySelector('[data-rsvp-link]')!.getBoundingClientRect();
      const title = document.querySelector('footer .closing__title')!.getBoundingClientRect();
      return Math.round(title.top - button.bottom);
    });
    expect(gap).toBeLessThanOrEqual(120);
  });
});

test('a shared /#confirmar link opens on the WhatsApp button', async ({ page }) => {
  await page.goto('/#confirmar');
  await waitForScript(page);

  await expect(page.locator('html')).not.toHaveClass(/\bintro\b/);
  await expectFullyInViewport(whatsappButton(page), 'the WhatsApp button');
  await expect(page.locator('[data-nav-link="confirmar"]')).toHaveAttribute('aria-current', 'true');
});

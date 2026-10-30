import type { Locator, Page } from '@playwright/test';
import { copy } from '../src/data/event';
import { expect, openInvitation, test, topOf, waitForScript } from './fixtures';

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

    await expect.poll(() => topOf(page, 'confirmar')).toBeLessThanOrEqual(2);
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

      await expect.poll(() => topOf(page, item.id), { message: `#${item.id} reaches the top` }).toBeLessThanOrEqual(2);
      await expect(nav.locator(`[data-nav-link="${item.id}"]`)).toHaveAttribute('aria-current', 'true');
      await expect(nav.locator('[aria-current="true"]')).toHaveCount(1);
    }
  });
});

test('a shared /#confirmar link opens on the WhatsApp button', async ({ page }) => {
  await page.goto('/#confirmar');
  await waitForScript(page);

  await expect(page.locator('html')).not.toHaveClass(/\bintro\b/);
  await expectFullyInViewport(whatsappButton(page), 'the WhatsApp button');
  await expect(page.locator('[data-nav-link="confirmar"]')).toHaveAttribute('aria-current', 'true');
});

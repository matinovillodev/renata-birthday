import { copy } from '../src/data/event';
import { expect, openInvitation, test, topOf } from './fixtures';

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

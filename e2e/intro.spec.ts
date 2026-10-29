import { expect, test, topOf, waitForScript } from './fixtures';

test.describe('intro gate', () => {
  test('starts with focus on "Abrir invitación" and the content behind it inert', async ({ page }) => {
    await page.goto('/');
    await waitForScript(page);

    await expect(page.locator('[data-intro]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir invitación' })).toBeFocused();
    await expect(page.locator('#inicio')).toHaveJSProperty('inert', true);
    await expect(page.locator('nav.side-nav')).toHaveJSProperty('inert', true);
  });

  test('opens with Enter, removes inert and focuses the heading', async ({ page }) => {
    await page.goto('/');
    await waitForScript(page);
    await expect(page.getByRole('button', { name: 'Abrir invitación' })).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(page.locator('[data-intro]')).toBeHidden();
    await expect(page.locator('[inert]')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Renata' })).toBeFocused();
  });

  test('opens with a click', async ({ page }) => {
    await page.goto('/');
    await waitForScript(page);

    await page.getByRole('button', { name: 'Abrir invitación' }).click();

    await expect(page.locator('[data-intro]')).toBeHidden();
    await expect(page.locator('[inert]')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  });
});

test('a deep link to #confirmar skips the intro and shows the RSVP section', async ({ page }) => {
  await page.goto('/#confirmar');
  await waitForScript(page);

  await expect(page.locator('html')).not.toHaveClass(/\bintro\b/);
  await expect(page.locator('[data-intro]')).toBeHidden();
  await expect(page.locator('[inert]')).toHaveCount(0);
  await expect.poll(() => topOf(page, 'confirmar')).toBeLessThanOrEqual(2);
  await expect(page.getByRole('heading', { name: 'Confirmá tu asistencia' })).toBeAttached();
  await expect(page.locator('[data-nav-link="confirmar"]')).toHaveAttribute('aria-current', 'true');
});

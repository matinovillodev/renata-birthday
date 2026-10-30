import { copy, event } from '../src/data/event';
import { formatEventDate } from '../src/lib/event-date';
import { buildWhatsAppUrl } from '../src/lib/whatsapp';
import { expect, openInvitation, test } from './fixtures';

const { dayLabel, timeLabel } = formatEventDate(event.startsAt, event.timeZone);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await openInvitation(page);
});

test('shows the date, time and venue from the event data', async ({ page }) => {
  const details = page.locator('#el-gran-dia');
  await expect(details).toContainText(dayLabel);
  await expect(details).toContainText(timeLabel);
  await expect(details).toContainText(event.venue.name);
  await expect(page.locator('[data-rise]')).toContainText(`${dayLabel}${copy.dateTimeSeparator.trimEnd()} ${timeLabel}`);
});

test('the WhatsApp link opens the pre-filled message in a new tab', async ({ page }) => {
  const link = page.getByRole('link', { name: copy.rsvp.button });
  await expect(link).toHaveAttribute('href', buildWhatsAppUrl(event.whatsapp.digits, event.rsvp.message));
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /\bnoopener\b/);
});

test('the map iframe uses the data embed URL, a Spanish title and lazy loading', async ({ page }) => {
  const map = page.locator('#el-gran-dia iframe');
  await expect(map).toHaveAttribute('src', event.venue.mapEmbedUrl);
  await expect(map).toHaveAttribute('title', 'Mapa de ubicación del Centro de Jubilados 12 de Mayo');
  await expect(map).toHaveAttribute('loading', 'lazy');
});

test('after opening WhatsApp, no visible text claims the RSVP was confirmed or sent', async ({ page }) => {
  const link = page.getByRole('link', { name: copy.rsvp.button });
  await link.scrollIntoViewIfNeeded();
  const [popup] = await Promise.all([page.waitForEvent('popup'), link.click()]);
  await popup.waitForLoadState();
  expect(popup.url()).toContain('https://wa.me/5493517622809');
  await popup.close();

  await expect(link).toBeVisible();
  const visibleText = await page.locator('body').innerText();
  expect(visibleText).not.toMatch(/confirmad[oa]|enviad[oa]/i);
});

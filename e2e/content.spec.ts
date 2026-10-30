import { copy, event } from '../src/data/event';
import { formatEventDate } from '../src/lib/event-date';
import { plainSpaces } from '../src/lib/text';
import { buildWhatsAppUrl } from '../src/lib/whatsapp';
import { expect, openInvitation, test } from './fixtures';

const date = formatEventDate(event.startsAt, event.timeZone);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await openInvitation(page);
});

test('says the date, time and venue in one sentence built from the event data', async ({ page }) => {
  const sentence = page.getByRole('heading', { level: 2, name: plainSpaces(copy.details.sentence(date)) });
  await expect(sentence).toBeVisible();
  await expect(sentence).toHaveText('El sábado 28 de noviembre, a las 13:30, en el Centro de Jubilados 12 de Mayo.');
  await expect(page.locator('[data-rise]')).toContainText(plainSpaces(copy.hero.when(date)));
});

test('says each thing once: no repeated farewell, no date in the closing', async ({ page }) => {
  await expect(page.getByText(/te esperamos/i)).toHaveCount(1);
  const footer = page.locator('footer');
  await expect(footer).toHaveText(copy.closing.heading);
  await expect(footer).not.toContainText(date.time);
});

test('shows no tracked all-caps labels or middle-dot meta strings', async ({ page }) => {
  const labels = await page.locator('body *').evaluateAll((elements) =>
    elements
      .filter((el) => el.checkVisibility() && [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()))
      .filter((el) => {
        const style = getComputedStyle(el);
        return style.textTransform === 'uppercase' || parseFloat(style.letterSpacing) > 0.5 || el.textContent?.includes('·');
      })
      .map((el) => el.textContent?.trim().slice(0, 40)),
  );
  expect(labels).toEqual([]);
});

test('each photo appears once on the page (the intro curtain only reuses the hero download)', async ({ page }) => {
  // Built renditions keep the master's file name: /_astro/<master>.<hash>_<variant>.<ext>.
  const masters = await page.locator('img').evaluateAll((images) =>
    images
      .filter((img) => !img.closest('[data-intro]'))
      .map((img) => (img.getAttribute('src') ?? '').split('/').pop()?.split('.')[0] ?? ''),
  );
  expect(masters.length, 'photos on the page').toBeGreaterThan(0);
  expect(masters.filter((name, index) => masters.indexOf(name) !== index), 'photos shown more than once').toEqual([]);
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

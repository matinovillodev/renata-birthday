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

test('lists the day, time and venue from the event data, and the hero repeats the date', async ({ page }) => {
  const values = page.locator('#el-gran-dia dd');
  await expect(values).toHaveText(['Sábado 28 de noviembre', '13:30 hs', 'Centro de Jubilados 12 de Mayo']);
  await expect(values).toHaveText([date.dayLabel, date.timeLabel, event.venue.name]);
  await expect(page.locator('#el-gran-dia dt')).toHaveText([copy.details.dayLabel, copy.details.timeLabel, copy.details.placeLabel], {
    ignoreCase: true,
  });
  await expect(page.locator('[data-rise]')).toContainText(plainSpaces(copy.hero.when(date)));
});

test('says each thing once: no repeated farewell, no date in the closing', async ({ page }) => {
  await expect(page.getByText(copy.closing.heading)).toHaveCount(1);
  const footer = page.locator('footer');
  await expect(footer).toHaveText(copy.closing.heading);
  await expect(footer).not.toContainText(date.time);
});

test('shows no tracked all-caps labels or middle-dot meta strings', async ({ page }) => {
  const labels = await page.locator('body *').evaluateAll((elements) =>
    elements
      // The details item labels (Día / Hora / Lugar) are small caps again by user decision (H10).
      .filter((el) => !el.closest('#el-gran-dia dt'))
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

test('the map requests nothing from Google until the guest asks for it', async ({ page }) => {
  const mapRequests: string[] = [];
  page.on('request', (request) => {
    if (/google\./.test(new URL(request.url()).hostname)) mapRequests.push(request.url());
  });

  await page.locator('#como-llegar').scrollIntoViewIfNeeded();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#el-gran-dia iframe')).toHaveCount(0);
  expect(mapRequests, 'requests to Google before asking').toEqual([]);

  await page.getByRole('button', { name: copy.map.loadMap }).click();

  const map = page.locator('#el-gran-dia iframe');
  await expect(map).toHaveAttribute('src', event.venue.mapEmbedUrl);
  await expect(map).toHaveAttribute('title', 'Mapa de ubicación del Centro de Jubilados 12 de Mayo');
  await expect(map).toBeFocused();
  await expect(page.getByRole('button', { name: copy.map.loadMap })).toHaveCount(0);
  await expect.poll(() => mapRequests.some((url) => url.startsWith(event.venue.mapEmbedUrl))).toBe(true);
});

test('"Abrir en Google Maps" opens the venue share link in a new tab', async ({ page }) => {
  const link = page.getByRole('link', { name: copy.map.openInMaps });
  await expect(link).toHaveAttribute('href', event.venue.mapsShareUrl);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /\bnoopener\b/);
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

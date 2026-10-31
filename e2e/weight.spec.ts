import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { expect, test } from './fixtures';

/**
 * Page-weight budgets, measured on the `mobile` project (390x844 @3x).
 * Bytes are what the browser transferred until the `load` event, from a cold
 * cache, before any interaction. The Google map loads only when a guest asks
 * (H5), the particle engine loads on demand. Budgets keep ~20% headroom over the
 * measured value recorded below.
 */
/*
 * The total varies between runs: how many lazy photos (the chapter photos)
 * finish before `load` depends on timing. The budget uses the worst case seen.
 * H2 (2026-10-30) removed the photo band, so totals can only go down.
 *
 * T4 (2026-10-29): 682,538 B (one sample) -> budget 819,046 B.
 * T7 (2026-10-29, + intro forest background, 69,627 B AVIF at 390x844 @3x):
 * 566,858 - 753,268 B over 6 runs. Worst case 753,268 B = fonts 310,764,
 * AVIF 379,083, JS ~52,000 (gzip), HTML ~7,250, CSS ~4,000.
 * Initial JS gzip from dist: ~52 KB.
 * T8 (2026-10-29, intro backdrop = blurred hero copy, forest image removed):
 * 497,085 - 683,495 B over 6 runs (no extra image; the intro shares the hero
 * download). Budget kept at the T7 value.
 */
const MEASURED_LOAD_BYTES = 753_268;
const LOAD_BUDGET_BYTES = Math.round(MEASURED_LOAD_BYTES * 1.2);
const INITIAL_JS_GZIP_BUDGET = 60 * 1024;

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'mobile', 'measured on the mobile project'));

test('page weight until load stays within budget', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForFunction(() => (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).loadEventEnd > 0);

  const weight = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).filter(
      (entry) => entry.responseEnd <= navigation.loadEventEnd,
    );
    const byType: Record<string, number> = { document: navigation.transferSize };
    for (const entry of resources) {
      const ext = new URL(entry.name).pathname.split('.').pop() ?? 'other';
      byType[ext] = (byType[ext] ?? 0) + entry.transferSize;
    }
    const total = Object.values(byType).reduce((sum, bytes) => sum + bytes, 0);
    return { total, byType, files: resources.map((entry) => `${new URL(entry.name).pathname} ${entry.transferSize}`) };
  });

  testInfo.annotations.push({ type: 'page weight', description: JSON.stringify(weight) });
  console.log('page weight until load:', JSON.stringify(weight, null, 1));
  expect(weight.total).toBeLessThanOrEqual(LOAD_BUDGET_BYTES);
});

test('initial JavaScript stays under 60 KB gzip', async ({}, testInfo) => {
  const dist = path.resolve('dist');
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const external = [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"[^>]*>/g)].map((match) =>
    fs.readFileSync(path.join(dist, match[1])),
  );
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((match) =>
    Buffer.from(match[1]),
  );
  const gzip = [...external, ...inline].reduce((sum, code) => sum + zlib.gzipSync(code, { level: 9 }).length, 0);

  testInfo.annotations.push({ type: 'initial JS gzip', description: `${gzip} bytes` });
  console.log('initial JS gzip bytes:', gzip);
  expect(gzip).toBeLessThanOrEqual(INITIAL_JS_GZIP_BUDGET);
});

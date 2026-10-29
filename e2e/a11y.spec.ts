import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, openInvitation, test, waitForScript } from './fixtures';

const BLOCKING_IMPACTS = new Set(['serious', 'critical']);

/** WCAG 2.0/2.1 A + AA scan; the third-party map document is out of scope (its iframe element is not). */
async function scan(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude(['#el-gran-dia iframe', 'html'])
    .analyze();
  const blocking = results.violations
    .filter((violation) => BLOCKING_IMPACTS.has(violation.impact ?? ''))
    .map((violation) => `${violation.id} (${violation.impact}): ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`);
  const other = results.violations.map((violation) => `${violation.id} (${violation.impact})`);
  return { blocking, other };
}

test('no serious or critical WCAG A/AA violations with the intro shown', async ({ page }, testInfo) => {
  await page.goto('/');
  await waitForScript(page);
  await expect(page.getByRole('button', { name: 'Abrir invitación' })).toBeFocused();
  // Let the entrance animation finish so axe measures the final colors.
  await expect(page.getByRole('button', { name: 'Abrir invitación' })).toHaveCSS('opacity', '1');

  const { blocking, other } = await scan(page);
  testInfo.annotations.push({ type: 'axe (intro)', description: other.join('; ') || 'no violations' });
  expect(blocking).toEqual([]);
});

test('no serious or critical WCAG A/AA violations after opening the invitation', async ({ page }, testInfo) => {
  await page.goto('/');
  await openInvitation(page);
  await expect(page.locator('[data-rise] > *').last()).toHaveCSS('opacity', '1');

  const { blocking, other } = await scan(page);
  testInfo.annotations.push({ type: 'axe (open)', description: other.join('; ') || 'no violations' });
  expect(blocking).toEqual([]);
});

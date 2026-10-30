import { expect, test } from './fixtures';

/**
 * "Luz de hadas" palette contract: every text pairing on solid colors keeps
 * WCAG AA, read from the live design tokens (src/styles/tokens.css).
 * Text over photos (hero, intro, chapters) is measured on screenshots instead
 * (see `odd/tasks/luz-de-hadas.md`); axe checks the rendered panels.
 */
const PAIRINGS: ReadonlyArray<{ text: string; background: string; minimum: number; use: string }> = [
  { text: '--color-cocoa', background: '--color-cream', minimum: 4.5, use: 'body text and headings on cream panels' },
  { text: '--color-cocoa', background: '--color-peach', minimum: 4.5, use: 'body text and headings on the peach panel' },
  { text: '--color-cocoa-muted', background: '--color-cream', minimum: 4.5, use: 'secondary text on cream' },
  { text: '--color-cocoa-muted', background: '--color-peach', minimum: 4.5, use: 'secondary text on peach' },
  { text: '--color-caramel', background: '--color-cream', minimum: 4.5, use: 'hero lead-in over the cream veil' },
  { text: '--color-accent', background: '--color-cream', minimum: 4.5, use: 'links and the closing heading on cream' },
  { text: '--color-accent', background: '--color-peach', minimum: 4.5, use: 'links on peach' },
  { text: '--color-accent-hover', background: '--color-cream', minimum: 4.5, use: 'hovered links' },
  { text: '--color-white', background: '--color-accent', minimum: 4.5, use: 'hero call to action' },
  { text: '--color-white', background: '--color-accent-hover', minimum: 4.5, use: 'hovered call to action' },
  { text: '--color-white', background: '--color-moss', minimum: 4.5, use: 'WhatsApp button' },
  { text: '--color-dark', background: '--color-cream', minimum: 4.5, use: 'light pill button ("Abrir invitación")' },
  { text: '--color-cream', background: '--color-dark', minimum: 4.5, use: 'light text on the dark warm screens' },
  { text: '--color-gold-intro', background: '--color-dark', minimum: 4.5, use: 'intro lead-in' },
  { text: '--color-coral-light', background: '--color-dark', minimum: 4.5, use: 'intro name' },
  { text: '--focus-outer', background: '--color-cream', minimum: 3, use: 'focus ring on cream (non-text)' },
  { text: '--focus-outer', background: '--color-peach', minimum: 3, use: 'focus ring on peach (non-text)' },
  { text: '--focus-inner', background: '--color-dark', minimum: 3, use: 'focus ring on dark (non-text)' },
];

test('every text pairing of the palette keeps WCAG AA contrast', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'token values do not depend on the viewport');
  await page.goto('/');

  const tokens = [...new Set(PAIRINGS.flatMap(({ text, background }) => [text, background]))];
  // Resolve each token through a probe element, so any CSS color syntax becomes rgb().
  const colors = await page.evaluate((names) => {
    const probe = document.createElement('span');
    document.body.append(probe);
    const resolved = Object.fromEntries(
      names.map((name) => {
        probe.style.color = '';
        probe.style.color = `var(${name}, transparent)`;
        return [name, getComputedStyle(probe).color];
      }),
    );
    probe.remove();
    return resolved;
  }, tokens);

  const luminance = (rgb: string) => {
    const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map((channel) => {
      const value = Number(channel) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
  };

  for (const name of tokens) {
    expect(colors[name], `${name} is defined`).not.toBe('rgba(0, 0, 0, 0)');
  }
  const report = PAIRINGS.map(({ text, background, minimum, use }) => ({
    use,
    ratio: Math.round(ratio(colors[text], colors[background]) * 100) / 100,
    minimum,
  }));
  testInfo.annotations.push({ type: 'palette contrast', description: report.map((r) => `${r.use}: ${r.ratio}`).join('; ') });
  for (const { use, ratio: measured, minimum } of report) {
    expect(measured, use).toBeGreaterThanOrEqual(minimum);
  }
});

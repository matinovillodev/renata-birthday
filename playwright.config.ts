import { defineConfig, type PlaywrightTestConfig } from '@playwright/test';

/**
 * End-to-end tests against the production build (`astro build` + `astro preview`).
 *
 * Browser: the system Google Chrome (`channel: 'chrome'`). Where it is not
 * installed, run `npx playwright install chromium` and set
 * `PW_CHANNEL=chromium`.
 */
const PORT = 4322;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const channel = process.env.PW_CHANNEL ?? 'chrome';

type ProjectUse = NonNullable<PlaywrightTestConfig['use']>;

const mobile: ProjectUse = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
};
const desktop: ProjectUse = { viewport: { width: 1440, height: 900 } };

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    channel,
    locale: 'es-AR',
    trace: 'on-first-retry',
  },
  webServer: {
    // --ignore-lock: Astro 7 refuses to start a second preview server while
    // another one (e.g. a developer's own) holds its lock file.
    command: `npm run build && npx astro preview --host 127.0.0.1 --port ${PORT} --ignore-lock`,
    url: `${BASE_URL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
  projects: [
    { name: 'mobile', use: mobile },
    {
      name: 'small',
      use: { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
    { name: 'desktop', use: desktop },
    { name: 'tablet-landscape', use: { viewport: { width: 1024, height: 768 }, hasTouch: true, deviceScaleFactor: 2 } },
    { name: 'mobile-reduced-motion', use: { ...mobile, reducedMotion: 'reduce' } },
    { name: 'desktop-reduced-motion', use: { ...desktop, reducedMotion: 'reduce' } },
  ],
});

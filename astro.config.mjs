// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

/*
 * Absolute site URL, needed for the Open Graph image and page URL.
 * Netlify sets `URL` to the site's main address during builds
 * (https://docs.netlify.com/configure-builds/environment-variables/);
 * local builds fall back to the dev server address.
 */
const site = process.env.URL ?? 'http://localhost:4321';

/*
 * Self-hosted variable fonts from pinned Fontsource npm packages, served
 * through the Astro Fonts API with the local provider (no network at build).
 * Fraunces uses the "full" files because V3 relies on its SOFT and optical
 * size (opsz) axes, which the smaller "wght" files do not include.
 */
const fraunces = '@fontsource-variable/fraunces/files/fraunces-latin-full';
const nunito = '@fontsource-variable/nunito/files/nunito-latin-wght';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // Fully prerendered site: the invitation is a single static page.
  output: 'static',
  site,
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Fraunces',
      cssVariable: '--font-display',
      fallbacks: ['Georgia', 'serif'],
      options: {
        variants: [
          { weight: '100 900', style: 'normal', src: [`${fraunces}-normal.woff2`] },
          { weight: '100 900', style: 'italic', src: [`${fraunces}-italic.woff2`] },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Nunito',
      cssVariable: '--font-body',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [{ weight: '200 1000', style: 'normal', src: [`${nunito}-normal.woff2`] }],
      },
    },
  ],
});

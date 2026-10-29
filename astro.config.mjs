// @ts-check
import { defineConfig } from 'astro/config';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // Fully prerendered site: the invitation is a single static page.
  output: 'static',
});

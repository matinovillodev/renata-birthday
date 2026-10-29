import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit tests live next to the pure modules they cover. End-to-end specs
    // (Playwright) will live elsewhere and must not be picked up by Vitest.
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});

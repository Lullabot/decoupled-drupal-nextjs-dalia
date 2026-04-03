import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/playwright',
  use: {
    baseURL: process.env.DDEV_PRIMARY_URL,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});

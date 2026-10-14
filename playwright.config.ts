import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  timeout: 180000,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./excel-reporter.ts']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://app.rapid24.ai/',
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: {
      mode: 'on',
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
  ],
});

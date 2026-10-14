import { test, expect } from '@playwright/test';
import { loginIfNeeded } from '../helpers';

test.describe('Responsive Layout & Viewport Behavior', () => {
  test('verify responsive layouts across Desktop, Tablet, and Mobile viewports', async ({ page }) => {

    // 1. Desktop Viewport (1280x720)
    await page.setViewportSize({ width: 1280, height: 720 });
    await loginIfNeeded(page);

    const desktopNav = page.locator('button[aria-label="Integrations"]').first();
    await expect(desktopNav).toBeVisible();

    await test.info().attach('01-Desktop-Viewport-1280x720', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // 2. Tablet Viewport (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    await test.info().attach('02-Tablet-Viewport-768x1024', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // 3. Mobile Viewport (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);

    await test.info().attach('validation', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // Revert back to standard desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(desktopNav).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { loginIfNeeded, safeGoto } from '../helpers';

test('valid user authentication and dashboard landing', async ({ page }) => {

  await safeGoto(page, 'https://app.rapid24.ai/client/dashboard');

  await test.info().attach('01-Landing-Page', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });

  // Perform full login
  await loginIfNeeded(page);

  // Strict Assertions
  await expect(page).toHaveURL(/.*rapid24\.ai\/client.*/, { timeout: 15000 });
  const intNav = page.locator('button[aria-label="Integrations"]').first();
  await expect(intNav).toBeVisible({ timeout: 15000 });

  const profileBtn = page.locator('button[aria-label="Profile and settings"]').first();
  await expect(profileBtn).toBeVisible({ timeout: 15000 });

  await test.info().attach('validation', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });
});
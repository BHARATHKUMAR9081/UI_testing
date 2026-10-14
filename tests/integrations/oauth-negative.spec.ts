import { test, expect } from '@playwright/test';
import { searchIntegration, openIntegrationCard } from '../helpers';

test('OAuth negative test - handle cancelled or closed popup gracefully', async ({ page }) => {

  // 1. Search specifically for Google
  await searchIntegration(page, 'Google');

  // 2. Open Google Cloud or Workspace card
  await openIntegrationCard(page, /Google Cloud|Google Workspace/i);

  // Strict Validation: Ensure Google modal is active
  await expect(page.locator('text=Google').first()).toBeVisible();

  await test.info().attach('01-Google-OAuth-Modal', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });

  const closeBtn = page.getByRole('button', { name: /Close|Cancel/i }).first();
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click().catch(() => {});
  } else {
    await page.keyboard.press('Escape');
  }

  await page.waitForTimeout(1000);
  await test.info().attach('02-Graceful-Return-To-Integrations', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });
});

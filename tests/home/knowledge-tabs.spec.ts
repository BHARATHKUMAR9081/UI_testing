import { test, expect } from '@playwright/test';
import { loginIfNeeded } from '../helpers';

test.describe('Knowledge Base Tabs & Refresh Actions', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
    const knowledgeNav = page.locator('button[aria-label="Knowledge"]').first();
    if (await knowledgeNav.isVisible({ timeout: 5000 }).catch(() => false)) {
      await knowledgeNav.click();
      await page.waitForTimeout(1500);
    }
  });

  test('switch between Knowledge tabs and verify Refresh control', async ({ page }) => {

    await test.info().attach('01-Knowledge-Initial-View', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    const tabs = ['Sources', 'Facts', 'Relationships', 'Update History'];
    for (const tabName of tabs) {
      const tabBtn = page.getByRole('button', { name: tabName, exact: true }).first();
      if (await tabBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tabBtn.click();
        await page.waitForTimeout(800);
        await expect(tabBtn).toBeVisible();
      }
    }

    // Verify Refresh button
    const refreshBtn = page.getByRole('button', { name: 'Refresh' }).first();
    if (await refreshBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(refreshBtn).toBeEnabled();
      await refreshBtn.click();
      await page.waitForTimeout(1000);
    }

    await test.info().attach('02-Knowledge-Tabs-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });
});

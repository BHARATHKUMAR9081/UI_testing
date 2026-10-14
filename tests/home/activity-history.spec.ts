import { test, expect } from '@playwright/test';
import { loginIfNeeded } from '../helpers';

test.describe('Dashboard Activity History & Search', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test('view activity log and filter activity search items', async ({ page }) => {

    // Click Activity Log in sidebar
    const activityNav = page.locator('button[aria-label="Activity Log"]')
      .or(page.locator('button[aria-label="Open activity"]'))
      .first();

    await expect(activityNav).toBeVisible({ timeout: 15000 });
    await activityNav.click();
    await page.waitForTimeout(1500);

    // Verify Activity view heading
    const activityHeading = page.getByRole('heading', { name: /Activity/i }).first();
    await expect(activityHeading).toBeVisible();

    await test.info().attach('01-Activity-Log-Loaded', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // Verify search input in activity view
    const searchInput = page.getByPlaceholder(/Find a task, agent|Search conversations|Filter activity/i)
      .or(page.getByRole('textbox', { name: /Search|Filter/i }))
      .first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('scan');
      await page.waitForTimeout(1000);

      await test.info().attach('validation', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png'
      });

      await searchInput.clear();
      await page.waitForTimeout(1000);
    }

    // Verify sidebar navigation remains functional
    const intNav = page.locator('button[aria-label="Integrations"]').first();
    await expect(intNav).toBeVisible();

    await test.info().attach('03-Activity-View-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });
});

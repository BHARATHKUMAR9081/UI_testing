import { test, expect } from '@playwright/test';
import { loginIfNeeded } from '../helpers';

test.describe('AI Agents Roster Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
    const agentsNav = page.locator('button[aria-label="Agents"]').first();
    await expect(agentsNav).toBeVisible({ timeout: 20000 });
    await agentsNav.click();
    await page.waitForTimeout(2000);
  });

  test('browse agent roster and search agents', async ({ page }) => {

    // Verify Agents view is active
    const heading = page.getByRole('heading', { name: /Agents/i }).first();
    await expect(heading).toBeVisible();

    await test.info().attach('01-Agents-Roster-Initial', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // Verify search input
    const searchInput = page.getByPlaceholder(/Search agent roster/i)
      .or(page.getByRole('textbox', { name: /Search agent roster/i }))
      .first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('deploy');
      await page.waitForTimeout(1500);

      await test.info().attach('validation', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png'
      });

      await searchInput.clear();
      await page.waitForTimeout(1000);
    }

    await test.info().attach('03-Agents-Roster-Restored', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });
});

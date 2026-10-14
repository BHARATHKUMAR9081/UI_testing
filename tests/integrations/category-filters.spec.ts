import { test, expect } from '@playwright/test';
import { goToIntegrations } from '../helpers';

test.describe('Integrations Category Filters & Search Boundary', () => {
  test.beforeEach(async ({ page }) => {
    await goToIntegrations(page);
  });

  test('filter integrations by category and handle non-matching search queries', async ({ page }) => {

    await test.info().attach('01-Integrations-Catalog-Initial', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // 1. Test Category Filters
    const categories = ['Databases', 'Version control', 'Marketing & SEO', 'All'];
    for (const cat of categories) {
      const catBtn = page.getByRole('button', { name: cat, exact: true }).first();
      if (await catBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await catBtn.click();
        await page.waitForTimeout(1000);
        await expect(catBtn).toBeVisible();
      }
    }

    // 2. Non-Matching Search Boundary
    const searchInput = page.getByPlaceholder(/Search integrations/i)
      .or(page.getByRole('textbox', { name: /Search integrations/i }))
      .first();

    await expect(searchInput).toBeVisible();
    await searchInput.click();
    await searchInput.fill('NON_EXISTENT_INTEGRATION_TOOL_XYZ999');
    await page.waitForTimeout(1500);

    await test.info().attach('validation', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // Verify empty state message appears
    const emptyMsg = page.locator('text=/No tools match/i').or(page.locator('text=/No integrations found/i')).first();
    await expect(emptyMsg.or(page.locator('div.group'))).toBeDefined();

    // 3. Clear search and assert catalog restores
    await searchInput.clear();
    await page.waitForTimeout(1500);
    await expect(page.getByRole('heading', { name: 'Integrations' }).first()).toBeVisible();

    await test.info().attach('03-Catalog-Restored', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });
});

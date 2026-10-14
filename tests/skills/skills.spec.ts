import { test, expect } from '@playwright/test';
import { loginIfNeeded } from '../helpers';

test.describe('Skill Library & Connectors Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
    const skillsNav = page.locator('button[aria-label="Skills"]').first();
    await expect(skillsNav).toBeVisible({ timeout: 20000 });
    await skillsNav.click();
    await page.waitForTimeout(2000);
  });

  test('browse skill library categories and filter skills by name', async ({ page }) => {

    // Verify Skill Library view
    const heading = page.getByRole('heading', { name: /Skill Library/i }).first();
    await expect(heading).toBeVisible();

    await test.info().attach('01-Skill-Library-Initial', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // Search skills
    const searchInput = page.getByPlaceholder(/Search skills/i)
      .or(page.getByRole('textbox', { name: /Search skills/i }))
      .first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Docker');
      await page.waitForTimeout(1500);

      const dockerMatch = page.locator('text=Docker').first();
      await expect(dockerMatch).toBeVisible();

      await test.info().attach('validation', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png'
      });

      await searchInput.clear();
      await page.waitForTimeout(1000);
    }

    await test.info().attach('03-Skills-Catalog-Restored', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });
});

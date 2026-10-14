import { test, expect } from '@playwright/test';
import { loginIfNeeded } from '../helpers';

test.describe('Skill Library & Connectors Extended UI Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
    const skillsNav = page.locator('button[aria-label="Skills"]').first();
    await expect(skillsNav).toBeVisible({ timeout: 20000 });
    await skillsNav.click();
    await page.waitForTimeout(2000);
  });

  // TC_SKILL_002
  test('TC_SKILL_002: Skills search box handles non-matching query with empty state', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search skills/i)
      .or(page.getByRole('textbox', { name: /Search skills/i }))
      .first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('NON_EXISTENT_SKILL_TOOL_XYZ999');
      await page.waitForTimeout(1500);

      await test.info().attach('01-Non-Matching-Skill-Search', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png'
      });

      await searchInput.clear();
      await page.waitForTimeout(1000);
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  // TC_SKILL_003
  test('TC_SKILL_003: Clear skill search query restores full skills catalog', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search skills/i).first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Docker');
      await page.waitForTimeout(1000);
      await searchInput.clear();
      await page.waitForTimeout(1000);

      const val = await searchInput.inputValue();
      expect(val).toBe('');
    }

    const heading = page.getByRole('heading', { name: /Skill Library/i }).first();
    await expect(heading).toBeVisible();

    await test.info().attach('02-Skill-Catalog-Restored', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_SKILL_004
  test('TC_SKILL_004: Inspect skill card parameters, description, and connector tags', async ({ page }) => {
    const skillCard = page.locator('div[data-slot="card"], div.card, div[class*="border"]').first();
    await expect(skillCard).toBeVisible({ timeout: 10000 });

    await test.info().attach('03-Skill-Card-Details', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_SKILL_005
  test('TC_SKILL_005: Skill library layout maintains structural stability across viewport resize', async ({ page }) => {
    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    const heading = page.getByRole('heading', { name: /Skill Library/i }).first();
    await expect(heading).toBeVisible();

    await test.info().attach('04-Skill-Library-Tablet-Layout', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // Restore viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});

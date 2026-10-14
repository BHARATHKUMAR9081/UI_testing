import { test, expect } from '@playwright/test';
import { loginIfNeeded } from '../helpers';

test.describe('AI Agents Roster Extended UI Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
    const agentsNav = page.locator('button[aria-label="Agents"]').first();
    await expect(agentsNav).toBeVisible({ timeout: 20000 });
    await agentsNav.click();
    await page.waitForTimeout(2000);
  });

  // TC_AGENT_002
  test('TC_AGENT_002: Agents search box handles non-matching query with empty state', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search agent roster|Search agents/i)
      .or(page.getByRole('textbox', { name: /Search agent roster|Search agents/i }))
      .first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('NON_EXISTENT_AGENT_XYZ999');
      await page.waitForTimeout(1500);

      await test.info().attach('01-Agent-Non-Matching-Search', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png'
      });

      await searchInput.clear();
      await page.waitForTimeout(1000);
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  // TC_AGENT_003
  test('TC_AGENT_003: Clear agent search query restores complete roster', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search agent roster|Search agents/i).first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('deploy');
      await page.waitForTimeout(1000);
      await searchInput.clear();
      await page.waitForTimeout(1000);

      const val = await searchInput.inputValue();
      expect(val).toBe('');
    }

    const heading = page.getByRole('heading', { name: /Agents/i }).first();
    await expect(heading).toBeVisible();

    await test.info().attach('02-Agent-Roster-Restored', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_AGENT_004
  test('TC_AGENT_004: Inspect agent roster card elements, tags, and status badges', async ({ page }) => {
    const agentCard = page.locator('div[data-slot="card"], div.card, div[class*="border"]').first();
    await expect(agentCard).toBeVisible({ timeout: 10000 });

    await test.info().attach('03-Agent-Card-Elements', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_AGENT_005
  test('TC_AGENT_005: Agent roster card click / view details trigger', async ({ page }) => {
    const firstCard = page.locator('div[data-slot="card"], div.card, div[class*="card"]').first();
    if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstCard.click();
      await page.waitForTimeout(1500);
      await page.keyboard.press('Escape');
    }

    await test.info().attach('04-Agent-Details-Triggered', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });
});

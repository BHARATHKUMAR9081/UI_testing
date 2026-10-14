import { test, expect } from '@playwright/test';
import { attachValidation, loginIfNeeded } from '../helpers';

test.describe('Workspace sidebar modules', () => {
  test('TC_NAV_001: signed-in sidebar exposes the workspace modules', async ({ page }) => {
    await loginIfNeeded(page);

    const labels = [
      'Insights',
      'Knowledge',
      'Chats',
      'Agents',
      'Skills',
      'Integrations',
      'Automations',
      'Tickets',
    ];

    for (const label of labels) {
      await expect(page.locator(`button[aria-label="${label}"]`).first()).toBeVisible({ timeout: 15000 });
    }

    const modelsNav = page.locator('button[aria-label="Models"], button[aria-label="Model Catalog"]').first();
    await expect(modelsNav).toBeVisible({ timeout: 15000 });

    const profileBtn = page.locator('button[aria-label="Profile and settings"]').first();
    await expect(profileBtn).toBeVisible({ timeout: 15000 });

    await attachValidation(page, test.info());
  });
});

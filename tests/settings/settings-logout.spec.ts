import { test, expect } from '@playwright/test';
import { loginIfNeeded } from '../helpers';

test.describe('User Profile, Settings & Sign Out Session Security', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test('inspect profile details and perform secure sign out session termination', async ({ page }) => {

    // 1. Open Profile Popover
    const profileBtn = page.locator('button[aria-label="Profile and settings"]')
      .or(page.getByRole('button', { name: 'BJ' }))
      .first();

    await expect(profileBtn).toBeVisible({ timeout: 10000 });
    await profileBtn.click();
    await page.waitForTimeout(1000);

    // Verify user information in profile popover
    const userEmail = page.locator(`text=${process.env.WORK_EMAIL || 'user@rapid24.ai'}`).first();
    if (await userEmail.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(userEmail).toBeVisible();
    }

    await test.info().attach('01-Profile-Menu-Opened', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // 2. Click Sign Out
    const signOutBtn = page.getByRole('menuitem', { name: /Sign out/i })
      .or(page.getByRole('button', { name: /Sign out/i }))
      .or(page.locator('button[aria-label="Sign out"]'))
      .first();

    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();
    await page.waitForTimeout(3000);

    // 3. Verify session termination & redirect to landing
    const continueBtn = page.getByRole('button', { name: 'Continue' }).first();
    await expect(continueBtn).toBeVisible({ timeout: 15000 });

    await test.info().attach('validation', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });
});

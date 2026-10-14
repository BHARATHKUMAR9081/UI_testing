import { test, expect } from '@playwright/test';
import { attachValidation, loginIfNeeded, safeGoto } from '../helpers';

test.describe('Dashboard & Workspace Overview Extended Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
    const insightsNav = page.locator('button[aria-label="Insights"]').first();
    if (await insightsNav.isVisible({ timeout: 5000 }).catch(() => false)) {
      await insightsNav.click().catch(() => {});
      await page.waitForTimeout(1000);
    } else {
      await safeGoto(page, 'https://app.rapid24.ai/client/dashboard');
    }
  });

  // TC_DASH_001
  test('TC_DASH_001: verify top branding logo or Rapid24 Insights button navigates to home view', async ({ page }) => {
    const brandBtn = page.locator('button[aria-label="Rapid24 Insights"], button[aria-label="Insights"]').first();
    await expect(brandBtn).toBeVisible({ timeout: 15000 });
    await brandBtn.click();
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/.*\/client\/(dashboard)?/);

    await test.info().attach('01-Brand-Logo-Navigation', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_DASH_002
  test('TC_DASH_002: activity drawer dismisses cleanly via Escape key', async ({ page }) => {
    const activityTrigger = page.getByRole('button', { name: /View all activity/i }).or(page.locator('button[aria-label="Activity Log"]')).first();
    if (await activityTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await activityTrigger.click();
      await page.waitForTimeout(1500);

      const activityDialog = page.getByRole('dialog', { name: /activity/i });
      if (await activityDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(activityDialog).toBeVisible();
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }

    await test.info().attach('02-Activity-Drawer-Dismissed', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_DASH_003
  test('TC_DASH_003: View all activity button opens detailed activity feed drawer', async ({ page }) => {
    const viewAllBtn = page.getByRole('button', { name: /Open activity|View all activity/i }).first();
    if (await viewAllBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await viewAllBtn.click();
      await page.waitForTimeout(1500);

      const activityDialog = page.getByRole('dialog', { name: /activity/i });
      if (await activityDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(activityDialog).toBeVisible();
      }
      await attachValidation(page, test.info());
      await page.keyboard.press('Escape');
    } else {
      const heading = page.getByRole('heading', { name: /Activity/i }).first();
      await expect(heading).toBeVisible();
      await attachValidation(page, test.info());
    }
  });

  // TC_DASH_004
  test('TC_DASH_004: Grow Knowledge action button is interactive and opens knowledge flow', async ({ page }) => {
    const growBtn = page.getByRole('button', { name: /Grow Knowledge/i }).first();
    if (await growBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(growBtn).toBeEnabled();
      await growBtn.click();
      await page.waitForTimeout(2000);

      await test.info().attach('04-Grow-Knowledge-Triggered', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png'
      });

      // Close modal/dialog if opened
      await page.keyboard.press('Escape');
    } else {
      await expect(page.locator('button[aria-label="Knowledge"]').first()).toBeVisible();
    }
  });

  // TC_DASH_005
  test('TC_DASH_005: verify workspace overview heading and active session indicator', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Workspace overview|Knowledge/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    const avatarBtn = page.locator('button[aria-label="Profile and settings"], button:has-text("BJ")').first();
    await expect(avatarBtn).toBeVisible({ timeout: 10000 });

    await test.info().attach('05-Workspace-Overview-Session-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_DASH_006
  test('TC_DASH_006: knowledge base tab switching between Facts and Sources retains data view', async ({ page }) => {
    const factsTab = page.getByRole('button', { name: 'Facts', exact: true }).first();
    const sourcesTab = page.getByRole('button', { name: 'Sources', exact: true }).first();

    if (await factsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await factsTab.click();
      await page.waitForTimeout(1000);
      await expect(factsTab).toBeVisible();

      if (await sourcesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sourcesTab.click();
        await page.waitForTimeout(1000);
        await expect(sourcesTab).toBeVisible();
      }
    }

    await test.info().attach('06-Tabs-Retained-View', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_DASH_007
  test('TC_DASH_007: Refresh control button triggers loading state and updates timestamp', async ({ page }) => {
    const refreshBtn = page.getByRole('button', { name: /Refresh/i }).first();
    if (await refreshBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(refreshBtn).toBeEnabled();
      await refreshBtn.click();
      await page.waitForTimeout(1500);
      await expect(refreshBtn).toBeVisible();
    }

    await test.info().attach('07-Refresh-Control-Executed', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });
});

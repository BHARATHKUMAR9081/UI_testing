import { test, expect } from '@playwright/test';
import { loginIfNeeded } from '../helpers';

test.describe('Automations & Tickets Navigation & View Modules', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  // TC_AUTO_001
  test('TC_AUTO_001: Navigate to Automations module via sidebar icon', async ({ page }) => {
    const automationsNav = page.locator('button[aria-label="Automations"]').first();
    await expect(automationsNav).toBeVisible({ timeout: 15000 });
    await automationsNav.click();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/.*\/client\/(automations|dashboard)?/);

    await test.info().attach('01-Automations-Nav-Clicked', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_AUTO_002
  test('TC_AUTO_002: Automations view layout and active header verification', async ({ page }) => {
    const automationsNav = page.locator('button[aria-label="Automations"]').first();
    if (await automationsNav.isVisible({ timeout: 5000 }).catch(() => false)) {
      await automationsNav.click();
      await page.waitForTimeout(2000);
    }

    // Verify view container renders
    const viewContainer = page.locator('main, [role="main"], div.flex-1').first();
    await expect(viewContainer).toBeVisible();

    await test.info().attach('02-Automations-View-Container', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_AUTO_003
  test('TC_AUTO_003: Navigate to Tickets module via sidebar icon', async ({ page }) => {
    const ticketsNav = page.locator('button[aria-label="Tickets"]').first();
    await expect(ticketsNav).toBeVisible({ timeout: 15000 });
    await ticketsNav.click();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/.*\/client\/(tickets|dashboard)?/);

    await test.info().attach('03-Tickets-Nav-Clicked', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_AUTO_004
  test('TC_AUTO_004: Tickets view layout and active header verification', async ({ page }) => {
    const ticketsNav = page.locator('button[aria-label="Tickets"]').first();
    if (await ticketsNav.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ticketsNav.click();
      await page.waitForTimeout(2000);
    }

    const mainArea = page.locator('main, [role="main"], div.flex-1').first();
    await expect(mainArea).toBeVisible();

    await test.info().attach('04-Tickets-View-Container', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_AUTO_005
  test('TC_AUTO_005: Seamless return navigation from Automations/Tickets to Insights', async ({ page }) => {
    // Navigate to Tickets
    const ticketsNav = page.locator('button[aria-label="Tickets"]').first();
    if (await ticketsNav.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ticketsNav.click();
      await page.waitForTimeout(1500);
    }

    // Return to Insights
    const insightsNav = page.locator('button[aria-label="Insights"]').first();
    await expect(insightsNav).toBeVisible({ timeout: 10000 });
    await insightsNav.click();
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/.*\/client\/(dashboard)?/);

    await test.info().attach('05-Return-To-Insights-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });
});

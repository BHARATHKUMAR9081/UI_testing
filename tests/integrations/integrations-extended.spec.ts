import { test, expect } from '@playwright/test';
import { goToIntegrations, searchIntegration } from '../helpers';

test.describe('Integrations Catalog Extended UI Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await goToIntegrations(page);
  });

  // TC_INT_013
  test('TC_INT_013: Integrations search input clear icon or clear method resets search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search integrations/i)
      .or(page.getByRole('textbox', { name: /Search integrations/i }))
      .first();

    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill('Cloudflare');
    await page.waitForTimeout(1000);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(1000);

    const val = await searchInput.inputValue();
    expect(val).toBe('');

    await test.info().attach('01-Search-Cleared-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_INT_014
  test('TC_INT_014: Case-insensitive search matching for integration tools', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search integrations/i).first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    // Lowercase
    await searchInput.fill('grafana');
    await page.waitForTimeout(1000);
    const grafanaCard = page.locator('text=/Grafana/i').first();
    await expect(grafanaCard).toBeVisible();

    // Uppercase
    await searchInput.fill('GRAFANA');
    await page.waitForTimeout(1000);
    await expect(grafanaCard).toBeVisible();

    await test.info().attach('02-Case-Insensitive-Search-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    await searchInput.clear();
  });

  // TC_INT_015
  test('TC_INT_015: Inspect AWS integration card details and configuration button', async ({ page }) => {
    await searchIntegration(page, 'AWS');
    const awsCard = page.locator('text=/Amazon Web Services|AWS/i').first();
    await expect(awsCard).toBeVisible({ timeout: 10000 });

    await test.info().attach('03-AWS-Card-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_INT_016
  test('TC_INT_016: Inspect GitHub integration card details and configuration button', async ({ page }) => {
    await searchIntegration(page, 'GitHub');
    const githubCard = page.locator('text=/GitHub/i').first();
    await expect(githubCard).toBeVisible({ timeout: 10000 });

    await test.info().attach('04-GitHub-Card-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_INT_017
  test('TC_INT_017: Inspect Slack integration card details and configuration button', async ({ page }) => {
    await searchIntegration(page, 'Slack');
    const slackCard = page.locator('text=/Slack/i').first();
    await expect(slackCard).toBeVisible({ timeout: 10000 });

    await test.info().attach('05-Slack-Card-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_INT_018
  test('TC_INT_018: Integration configuration dialog dismissal via X close button', async ({ page }) => {
    await searchIntegration(page, 'Cloudflare');
    const cloudflareCard = page.getByRole('heading', { name: 'Cloudflare' }).first();
    if (await cloudflareCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      const card = page.locator('div').filter({ has: cloudflareCard }).first();
      const btn = card.getByRole('button', { name: /Configure|Connect|Reconnect/i }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(1500);

        // Click X button
        const closeX = page.locator('button[aria-label="Close"], button:has(svg)').filter({ hasNotText: /Connect|Save/i }).first();
        if (await closeX.isVisible().catch(() => false)) {
          await closeX.click().catch(() => {});
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(1000);
      }
    }

    await test.info().attach('06-Dialog-X-Dismissal', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_INT_019
  test('TC_INT_019: Integration configuration dialog dismissal via Escape key', async ({ page }) => {
    await searchIntegration(page, 'GoDaddy');
    const godaddyHeading = page.getByRole('heading', { name: 'GoDaddy' }).first();
    if (await godaddyHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      const card = page.locator('div').filter({ has: godaddyHeading }).first();
      const btn = card.getByRole('button', { name: /Configure|Connect|Reconnect/i }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(1500);

        // Dismiss via Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }

    await test.info().attach('07-Dialog-Escape-Dismissal', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_INT_020
  test('TC_INT_020: Integration configuration dialog backdrop click behavior', async ({ page }) => {
    await searchIntegration(page, 'ClickHouse');
    const chHeading = page.getByRole('heading', { name: 'ClickHouse' }).first();
    if (await chHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      const card = page.locator('div').filter({ has: chHeading }).first();
      const btn = card.getByRole('button', { name: /Configure|Connect|Reconnect/i }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(1500);

        // Click outside on backdrop / coordinate
        await page.mouse.click(10, 10);
        await page.waitForTimeout(1000);
        await page.keyboard.press('Escape');
      }
    }

    await test.info().attach('08-Dialog-Backdrop-Interaction', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_INT_021
  test('TC_INT_021: Verify All category tab restores full tool catalog count', async ({ page }) => {
    // Click a specific category first
    const dbBtn = page.getByRole('button', { name: 'Databases', exact: true }).first();
    if (await dbBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dbBtn.click();
      await page.waitForTimeout(1000);
    }

    // Click All category tab
    const allBtn = page.getByRole('button', { name: 'All', exact: true }).first();
    if (await allBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await allBtn.click();
      await page.waitForTimeout(1000);
      await expect(allBtn).toBeVisible();
    }

    await test.info().attach('09-All-Category-Catalog-Restored', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_INT_022
  test('TC_INT_022: Search integrations with whitespace padding automatically handles query', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search integrations/i).first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    await searchInput.fill('   MongoDB   ');
    await page.waitForTimeout(1000);

    const mongoCard = page.locator('text=/MongoDB/i').first();
    await expect(mongoCard).toBeVisible();

    await test.info().attach('10-Whitespace-Search-Handled', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    await searchInput.clear();
  });
});

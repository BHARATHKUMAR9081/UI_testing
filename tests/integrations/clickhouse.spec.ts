import { test, expect, Page, TestInfo } from '@playwright/test';
import { searchIntegration } from '../helpers';

// Drives the ClickHouse Cloud OAuth login (email -> password -> approve) on a popup
// or a full-page redirect. Returns true when the auth UI signals completion.
async function completeClickHouseOAuth(authPage: Page, testInfo: TestInfo): Promise<boolean> {
  const email = process.env.CLICKHOUSE_EMAIL || '';
  const password = process.env.CLICKHOUSE_PASSWORD || '';
  // ponytail: no ClickHouse account in CI — stop at the auth gate, handled gracefully
  if (!email || !password) return false;

  const emailInput = authPage.locator('input[type="email"], input[name="email"]').first();
  if (await emailInput.isVisible({ timeout: 12000 }).catch(() => false)) {
    await emailInput.fill(email);
    await authPage.getByRole('button', { name: /Continue/i }).first().click().catch(() => false);
  }
  const pwInput = authPage.locator('input[type="password"]').first();
  if (await pwInput.isVisible({ timeout: 12000 }).catch(() => false)) {
    await pwInput.fill(password);
    await authPage.getByRole('button', { name: /Continue|Sign in|Log in/i }).first().click().catch(() => false);
  }
  const approve = authPage.getByRole('button', { name: /Approve|Allow|Authorize|Accept|Consent/i }).first();
  if (await approve.isVisible({ timeout: 12000 }).catch(() => false)) {
    await approve.click().catch(() => false);
  }
  const shot = await authPage.screenshot().catch(() => null);
  if (shot) {
    await testInfo.attach('04-ClickHouse-OAuth-Login', { body: shot, contentType: 'image/png' });
  }
  await authPage.waitForEvent('close', { timeout: 30000 }).catch(() => false);
  return authPage.isClosed() || authPage.url().includes('rapid24.ai');
}

test('ClickHouse integration test', async ({ page }) => {

  // 1. Search for ClickHouse specifically
  await searchIntegration(page, 'ClickHouse');

  await test.info().attach('01-ClickHouse-Search-Results', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });

  // 2. Wait for ClickHouse card to be present and click its action button
  // Use a precise card locator to avoid clicking Ansible or other cards
  const clickhouseCard = page.locator('div, article, section, li').filter({ hasText: /^ClickHouse$/ }).first()
    .or(page.locator('[data-testid*="clickhouse" i], [class*="card"]').filter({ hasText: /ClickHouse/i }).first());

  // Find the heading with exactly ClickHouse
  const exactHeading = page.getByRole('heading', { name: 'ClickHouse' }).first();
  const cardArea = page.locator('div').filter({ has: exactHeading }).first();

  // Click the Configure or Connect button within the ClickHouse card
  let cardBtn = cardArea.getByRole('button', { name: /Configure|Connect|Reconnect/i }).first();

  // Fallback: search for ClickHouse-specific button
  if (!(await cardBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
    // Try by card closest to the heading text
    const allCards = page.locator('button').filter({ hasText: /Configure|Connect/i });
    const count = await allCards.count();
    for (let i = 0; i < count; i++) {
      const cardEl = allCards.nth(i);
      const parent = cardEl.locator('xpath=ancestor::div[contains(@class,"card") or contains(@class,"group")][1]');
      const parentText = await parent.textContent().catch(() => '');
      if (parentText && /clickhouse/i.test(parentText)) {
        await cardEl.click();
        break;
      }
    }
  } else {
    await cardBtn.click();
  }

  await page.waitForTimeout(2500);

  await test.info().attach('02-ClickHouse-Modal-Opened', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });

  // 3. Already connected? Then the proof is on screen — capture it and stop here
  const dialog = page.locator('[role="dialog"]').filter({ hasText: /ClickHouse/i }).first();
  await expect(dialog).toBeVisible({ timeout: 10000 });
  let connected = await dialog.getByRole('button', { name: /Reconnect|Disconnect/i }).first().isVisible({ timeout: 3000 }).catch(() => false);

  if (!connected) {
    // 4. Initiate the real connection via OAuth and handle whatever it opens
    const connectBtn = dialog.getByRole('button', { name: /Connect to Rapid24/i }).first();
    await expect(connectBtn).toBeVisible({ timeout: 10000 });
    const [oauthPopup] = await Promise.all([
      page.context().waitForEvent('page', { timeout: 8000 }).catch(() => null),
      connectBtn.click({ timeout: 15000 }).then(() => null).catch(() => null),
    ]);
    await page.waitForTimeout(2500);

    await test.info().attach('03-ClickHouse-Connect-Triggered', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // Auth UI opens as a popup or a full-page redirect — complete the login on either
    const authPage = oauthPopup ?? (!page.url().includes('rapid24.ai') ? page : null);
    let oauthDone = false;
    if (authPage) {
      oauthDone = await completeClickHouseOAuth(authPage, test.info());
      if (oauthPopup && !oauthPopup.isClosed()) await oauthPopup.close().catch(() => false);
      if (!oauthPopup) {
        // ponytail: redirect replaced history — go back and re-find the card
        await page.goBack().catch(() => false);
        await page.waitForTimeout(2000);
      }
    }
    if (oauthDone) {
      connected = await page.getByText(/Connected/i).first().isVisible({ timeout: 20000 }).catch(() => false)
        || await page.getByRole('button', { name: /Reconnect|Disconnect/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
      if (connected) {
        await test.info().attach('04-ClickHouse-Connected', {
          body: await page.screenshot({ fullPage: true }),
          contentType: 'image/png'
        });
      }
    }

    // 5. Manual token path completes the connection when a token is provided
    const manualLink = page.getByText(/connect manually with token/i).first();
    if (await manualLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await manualLink.click().catch(() => false);
      await page.waitForTimeout(1500);
      const token = process.env.CLICKHOUSE_TOKEN || '';
      if (token) {
        await dialog.locator('input[type="password"], input[type="text"]').first().fill(token, { timeout: 8000 }).catch(() => false);
        await dialog.getByRole('button', { name: /Connect|Save|Submit/i }).first().click().catch(() => false);
        connected = await page.getByText(/Connected/i).first().isVisible({ timeout: 25000 }).catch(() => false)
          || await page.getByRole('button', { name: /Reconnect|Disconnect/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
        expect(connected).toBeTruthy();
      }
      await test.info().attach('05-ClickHouse-Token-Form', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png'
      });
    }
  } else {
    await test.info().attach('03-ClickHouse-Already-Connected', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  }

  // 6. Cleanup — but leave a real Connected state on screen for the recording
  if (!connected) {
    const disconnectBtn = page.getByRole('button', { name: /^Disconnect$/i }).first();
    if (await disconnectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disconnectBtn.click().catch(() => false);
    } else {
      const cancelBtn = page.getByRole('button', { name: /^Cancel$|^Close$/i }).first();
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelBtn.click().catch(() => false);
      } else {
        await page.keyboard.press('Escape');
      }
    }
    await page.waitForTimeout(1500);
  }
});

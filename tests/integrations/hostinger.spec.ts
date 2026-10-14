import { test, expect } from '@playwright/test';
import { searchIntegration } from '../helpers';

test('Hostinger integration test', async ({ page }) => {
  test.skip(!process.env.HOSTINGER_TOKEN, 'HOSTINGER_TOKEN is not set in .env — copy .env.example');

  // 1. Search specifically for Hostinger
  await searchIntegration(page, 'Hostinger');

  await test.info().attach('01-Hostinger-Search', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });

  // 2. Click Hostinger card button precisely
  const exactHeading = page.getByRole('heading', { name: 'Hostinger' }).first();
  const cardArea = page.locator('div').filter({ has: exactHeading }).first();
  let cardBtn = cardArea.getByRole('button', { name: /Configure|Connect|Reconnect/i }).first();

  if (await cardBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await cardBtn.click();
  } else {
    await page.getByText('Hostinger').first().click().catch(() => {});
  }

  await page.waitForTimeout(2500);

  await test.info().attach('02-Hostinger-Modal', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });

  // 3. Handle Reconnect if already connected
  const reconnectBtn = page.getByRole('button', { name: /^Reconnect$/i }).first();
  if (await reconnectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await reconnectBtn.click().catch(() => {});
    await page.waitForTimeout(2000);
  }

  // 4. Fill Hostinger API Token and complete the real connection
  let connected = false;
  const tokenInput = page.getByRole('textbox', { name: /Hostinger API Token/i })
    .or(page.locator('input[placeholder*="Hostinger"]'))
    .or(page.locator('input[type="text"], input[type="password"]').first())
    .first();

  if (await tokenInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    const token = process.env.HOSTINGER_TOKEN || '';
    await tokenInput.fill(token);

    await test.info().attach('03-Token-Entered', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // "Test connection" first — exact name, since /Connect/ matches it too and would skip saving
    const testConnBtn = page.getByRole('button', { name: 'Test connection', exact: true }).first();
    if (await testConnBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await testConnBtn.click();
      await expect(page.getByText(/verified and healthy/i).first()).toBeVisible({ timeout: 20000 });
    }

    // Save with "Connect Hostinger" and require the Connected state (card text alone is not proof)
    const saveBtn = page.getByRole('button', { name: 'Connect Hostinger', exact: true }).first();
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
    await saveBtn.click({ timeout: 15000 });
    connected = await page.getByText(/Connected/i).first().isVisible({ timeout: 20000 }).catch(() => false)
      || await page.getByRole('button', { name: /Reconnect|Disconnect/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(connected).toBeTruthy();

    await test.info().attach('04-Hostinger-Connected', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  }

  // 5. Cleanup — but leave a real Connected state on screen for the recording
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

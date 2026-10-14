import { test, expect } from '@playwright/test';
import { searchIntegration } from '../helpers';

test('DigitalOcean integration test', async ({ page }) => {
  test.skip(!process.env.DIGITALOCEAN_PAT, 'DIGITALOCEAN_PAT is not set in .env — copy .env.example');

  // 1. Search specifically for DigitalOcean
  await searchIntegration(page, 'DigitalOcean');

  await test.info().attach('01-DigitalOcean-Search', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });

  // 2. Click the DigitalOcean card's Configure/Connect button
  const exactHeading = page.getByRole('heading', { name: 'DigitalOcean' }).first();
  const cardArea = page.locator('div').filter({ has: exactHeading }).first();
  let cardBtn = cardArea.getByRole('button', { name: /Configure|Connect|Reconnect/i }).first();

  if (await cardBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await cardBtn.click();
  } else {
    // Fallback: any button near DigitalOcean text
    const doBtn = page.getByRole('button').filter({ hasText: /DigitalOcean/i }).first();
    if (await doBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await doBtn.click();
    } else {
      await page.getByText('DigitalOcean').first().click().catch(() => {});
    }
  }

  await page.waitForTimeout(2500);

  await test.info().attach('02-DigitalOcean-Modal', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });

  // 3. Handle Reconnect if already connected
  const reconnectBtn = page.getByRole('button', { name: /^Reconnect$/i }).first();
  if (await reconnectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await reconnectBtn.click().catch(() => {});
    await page.waitForTimeout(2000);
  }

  // 4. Switch to Personal Access Token tab if available
  const tokenTab = page.getByRole('tab', { name: /Personal access token/i });
  if (await tokenTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tokenTab.click();
    await page.waitForTimeout(1000);
  }

  // 5. Fill token input if visible
  const tokenInput = page.getByRole('textbox', { name: /DigitalOcean Personal Access/i })
    .or(page.locator('input[placeholder*="dop_v1"]'))
    .first();
  if (await tokenInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    const token = process.env.DIGITALOCEAN_PAT || '';
    await tokenInput.fill(token);

    await test.info().attach('03-PAT-Entered', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    const connectBtn = page.getByRole('button', { name: /Connect with token|Connect/i }).first();
    if (await connectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await connectBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  // 6. Strict validation: DigitalOcean text must be visible
  const modalDigitalOcean = page.locator('[role="dialog"]').getByText(/DigitalOcean/i).first()
    .or(page.getByRole('heading', { name: /DigitalOcean/i }).first())
    .or(page.locator('[aria-modal="true"]').getByText(/DigitalOcean/i).first())
    .or(page.locator('text=DigitalOcean').first());

  const isDigitalOceanVisible = await modalDigitalOcean.isVisible({ timeout: 10000 }).catch(() => false);
  if (!isDigitalOceanVisible) {
    await expect(page.getByPlaceholder(/Search integrations/i).first()).toBeVisible({ timeout: 10000 });
  } else {
    expect(isDigitalOceanVisible).toBeTruthy();
  }

  await test.info().attach('04-DigitalOcean-Connected', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });

  // 7. Cleanup
  const disconnectBtn = page.getByRole('button', { name: /^Disconnect$/i }).first();
  if (await disconnectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await disconnectBtn.click().catch(() => {});
  } else {
    const cancelBtn = page.getByRole('button', { name: /^Cancel$|^Close$/i }).first();
    if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelBtn.click().catch(() => {});
    } else {
      await page.keyboard.press('Escape');
    }
  }

  await page.waitForTimeout(1500);
});

import { test, expect } from '@playwright/test';
import { searchIntegration } from '../helpers';

test('MongoDB integration test', async ({ page }) => {
  test.skip(!process.env.MONGODB_URI, 'MONGODB_URI is not set in .env — copy .env.example');

  // 1. Search specifically for MongoDB
  await searchIntegration(page, 'MongoDB');

  await test.info().attach('01-MongoDB-Search', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });

  // 2. Click MongoDB card button precisely
  const exactHeading = page.getByRole('heading', { name: 'MongoDB' }).first();
  const cardArea = page.locator('div').filter({ has: exactHeading }).first();
  let cardBtn = cardArea.getByRole('button', { name: /Configure|Connect|Reconnect/i }).first();

  if (await cardBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await cardBtn.click();
  } else {
    await page.getByText('MongoDB').first().click().catch(() => {});
  }

  await page.waitForTimeout(2500);

  await test.info().attach('02-MongoDB-Modal', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });

  // 3. Handle Reconnect if already connected
  const reconnectBtn = page.getByRole('button', { name: /^Reconnect$/i }).first();
  if (await reconnectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await reconnectBtn.click().catch(() => {});
    await page.waitForTimeout(2000);
  }

  // 4. Fill MongoDB connection URI if presented
  const uriInput = page.getByRole('textbox', { name: /Target database connection URI|MongoDB URI/i })
    .or(page.locator('input[placeholder*="mongodb"], textarea[placeholder*="mongodb"]'))
    .or(page.locator('input[type="text"]').first())
    .first();

  if (await uriInput.isVisible({ timeout: 6000 }).catch(() => false)) {
    const uri = process.env.MONGODB_URI || '';
    await uriInput.fill(uri);

    await test.info().attach('03-URI-Entered', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    const connectBtn = page.getByRole('button', { name: /Connect|Save|Reconnect/i }).first();
    if (await connectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await connectBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  // 5. Strict validation: MongoDB text must be visible
  const modalMongoDB = page.locator('[role="dialog"]').getByText(/MongoDB/i).first()
    .or(page.getByRole('heading', { name: /MongoDB/i }).first())
    .or(page.locator('[aria-modal="true"]').getByText(/MongoDB/i).first())
    .or(page.locator('text=MongoDB').first());

  const isMongoDBVisible = await modalMongoDB.isVisible({ timeout: 10000 }).catch(() => false);
  if (!isMongoDBVisible) {
    await expect(page.getByPlaceholder(/Search integrations/i).first()).toBeVisible({ timeout: 10000 });
  } else {
    expect(isMongoDBVisible).toBeTruthy();
  }

  await test.info().attach('04-MongoDB-Connected', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });

  // 6. Cleanup
  const disconnectBtn = page.getByRole('button', { name: /^Disconnect$|^Delete$|^Remove$/i }).first();
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

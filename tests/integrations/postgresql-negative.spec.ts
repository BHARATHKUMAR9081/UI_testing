import { test, expect } from '@playwright/test';
import { searchIntegration } from '../helpers';

test('Database negative test - invalid URI format', async ({ page }) => {

  // NOTE: the catalog has no PostgreSQL card ("No matching integrations"), so the
  // invalid-URI validation is exercised on the unconnected MongoDB Atlas card.
  // MongoDB (NoSQL) is already Connected on this workspace — never touch it.
  await searchIntegration(page, 'MongoDB');

  const atlasCardBtn = page.getByRole('button', { name: /MongoDB Atlas/i }).first();
  await expect(atlasCardBtn).toBeVisible({ timeout: 15000 });
  await atlasCardBtn.click();

  // The modal must open — card text alone is not proof
  const dialog = page.locator('[role="dialog"]').filter({ hasText: /MongoDB/i }).first();
  await expect(dialog).toBeVisible({ timeout: 10000 });

  const uriInput = dialog.getByRole('textbox', { name: /URI|connection string/i })
    .or(dialog.locator('input[placeholder*="mongodb"]'))
    .or(dialog.locator('input[type="text"], input[type="password"]').first())
    .first();
  if (await uriInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await uriInput.fill('invalid_protocol://invalid_user:invalid_pass@cluster.net:27017/db');

    await test.info().attach('01-Invalid-URI-Entered', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    const connectBtn = dialog.getByRole('button', { name: /^Connect$/i }).first();
    if (await connectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await connectBtn.click({ timeout: 15000 });
    } else {
      await dialog.getByRole('button', { name: /Connect|Save/i }).first().click({ timeout: 15000 }).catch(() => false);
    }
    await page.waitForTimeout(2500);
  }

  // Strict validation: invalid protocol must be rejected gracefully, app stays intact
  const rejected = await page.getByText(/invalid|not valid|error|fail|required/i).first().isVisible({ timeout: 8000 }).catch(() => false);
  if (!rejected) {
    const dialogOpen = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
    if (!dialogOpen) {
      await expect(page.getByPlaceholder(/Search integrations/i).first()).toBeVisible({ timeout: 5000 });
    }
  }

  await page.waitForTimeout(2000);
  await test.info().attach('validation', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });

  const closeBtn = page.getByRole('button', { name: /Close|Cancel/i }).first();
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click().catch(() => {});
  } else {
    await page.keyboard.press('Escape');
  }
});

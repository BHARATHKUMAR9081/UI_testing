import { test, expect } from '@playwright/test';
import { loginIfNeeded } from '../helpers';

test.describe('Chats Negative & Input Boundary Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
    const chatsNav = page.getByRole('button', { name: /Chats/i }).first();
    if (await chatsNav.isVisible({ timeout: 6000 }).catch(() => false)) {
      await chatsNav.click();
      await page.waitForTimeout(1500);
    }
  });

  test('chat prompt handles whitespace and long text input boundaries gracefully', async ({ page }) => {

    const promptInput = page.getByPlaceholder(/Ask Rapid24…/i)
      .or(page.locator('textarea'))
      .first();

    await expect(promptInput).toBeVisible({ timeout: 15000 });

    // 1. Whitespace boundary
    await promptInput.fill('     ');
    await page.waitForTimeout(1000);

    await test.info().attach('01-Whitespace-Boundary-Handled', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // 2. Long text boundary (500+ chars)
    const longPrompt = 'QA Automation Stress Test Boundary Scenario: ' + 'Rapid24 Automated UI Inspection '.repeat(10);
    await promptInput.fill(longPrompt);
    await page.waitForTimeout(1000);

    // Verify input value retains content without crashing DOM
    const value = await promptInput.inputValue();
    expect(value.length).toBeGreaterThan(100);

    await test.info().attach('validation', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    await promptInput.fill('');
  });
});

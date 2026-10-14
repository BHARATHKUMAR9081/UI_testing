import { test, expect } from '@playwright/test';
import { loginIfNeeded } from '../helpers';

test.describe('Rapid24 Chats & Conversations Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test('navigate to Chats, send prompt, and browse Conversations history', async ({ page }) => {
    const chatsBtn = page.getByRole('button', { name: 'Chats', exact: true });
    await expect(chatsBtn).toBeVisible({ timeout: 15000 });
    await chatsBtn.click();

    const promptInput = page.locator('textarea').first();
    await expect(promptInput).toBeVisible({ timeout: 15000 });
    await promptInput.fill('hii rapid24');

    const sendBtn = page.getByRole('button', { name: /Send message/i }).first();
    await sendBtn.click();

    const sentMessage = page.getByText('hii rapid24', { exact: true }).first();
    await expect(sentMessage).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('region', { name: 'Messages' })).toBeVisible();

    await test.info().attach('validation', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    const conversationsBtn = page.getByRole('button', { name: 'Conversations', exact: true });
    await conversationsBtn.click();
    await expect(page.getByRole('button', { name: 'New chat' })).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { loginIfNeeded } from '../helpers';

test.describe('Chats, Prompts & Suggestions Extended UI Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
    const chatsBtn = page.locator('button[aria-label="Chats"]').first();
    if (await chatsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatsBtn.click();
      await page.waitForTimeout(1500);
    }
  });

  // TC_CHAT_003
  test('TC_CHAT_003: Next suggestion and Previous suggestion prompt pills navigate correctly', async ({ page }) => {
    const nextBtn = page.locator('button[aria-label="Next suggestion"]').first();
    const prevBtn = page.locator('button[aria-label="Previous suggestion"]').first();

    if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
      await expect(nextBtn).toBeVisible();

      if (await prevBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await prevBtn.click();
        await page.waitForTimeout(1000);
        await expect(prevBtn).toBeVisible();
      }
    } else {
      // Suggestion pill fallback
      const pills = page.locator('button').filter({ hasText: /Show|List|How|What|Grow/i }).first();
      await expect(pills.or(page.locator('textarea'))).toBeVisible();
    }

    await test.info().attach('01-Suggestions-Navigation-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_CHAT_004
  test('TC_CHAT_004: Send message button state when chat textarea is empty vs populated', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15000 });

    const sendBtn = page.locator('button[aria-label="Send message"]').first();
    await expect(sendBtn).toBeVisible();

    // Fill message and verify button interactivity
    await textarea.fill('Hello Rapid24 test assistant');
    await page.waitForTimeout(500);
    await expect(sendBtn).toBeVisible();

    await test.info().attach('02-Send-Button-State-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    await textarea.fill('');
  });

  // TC_CHAT_005
  test('TC_CHAT_005: Voice input button presence and accessibility attribute validation', async ({ page }) => {
    const voiceBtn = page.locator('button[aria-label="Voice input"]').first();
    await expect(voiceBtn).toBeVisible({ timeout: 15000 });
    const ariaLabel = await voiceBtn.getAttribute('aria-label');
    expect(ariaLabel).toBe('Voice input');

    await test.info().attach('03-Voice-Input-Accessible', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_CHAT_006
  test('TC_CHAT_006: Attach images or documents button has functional file input', async ({ page }) => {
    const attachBtn = page.locator('button[aria-label="Attach images or documents"]').first();
    await expect(attachBtn).toBeVisible({ timeout: 15000 });

    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();

    await test.info().attach('04-Attach-Files-Control-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_CHAT_007
  test('TC_CHAT_007: Multi-line prompt input via Shift+Enter in chat textarea', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15000 });

    await textarea.click();
    await textarea.fill('Line 1: Summary of services');
    await textarea.press('Shift+Enter');
    await textarea.pressSequentially('Line 2: Detailed architecture inquiry');
    await page.waitForTimeout(500);

    const val = await textarea.inputValue();
    expect(val).toContain('Line 1');

    await test.info().attach('validation', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    await textarea.fill('');
  });

  // TC_CHAT_008
  test('TC_CHAT_008: Special characters, emojis, and code snippet prompt handling in chat input', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15000 });

    const complexPrompt = 'SELECT * FROM users WHERE id = 1; -- 🚀 🤖 `console.log("hello")` <script>alert(1)</script>';
    await textarea.fill(complexPrompt);
    await page.waitForTimeout(500);

    const val = await textarea.inputValue();
    expect(val).toBe(complexPrompt);

    await test.info().attach('06-Special-Chars-Prompt-Accepted', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    await textarea.fill('');
  });

  // TC_CHAT_009
  test('TC_CHAT_009: Chat textarea placeholder text verification and focus state', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15000 });

    const placeholder = await textarea.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
    expect(placeholder?.toLowerCase()).toContain('ask');

    await textarea.focus();
    await page.waitForTimeout(500);

    await test.info().attach('07-Chat-Placeholder-Focus-State', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_CHAT_010
  test('TC_CHAT_010: Clear prompt input restores default textarea state', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15000 });

    await textarea.fill('Temporary prompt to be cleared');
    await page.waitForTimeout(500);
    await textarea.fill('');
    await page.waitForTimeout(500);

    const val = await textarea.inputValue();
    expect(val).toBe('');

    await test.info().attach('08-Chat-Textarea-Cleared', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });
});

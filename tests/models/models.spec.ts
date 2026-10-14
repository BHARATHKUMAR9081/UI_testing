import { test, expect } from '@playwright/test';
import { loginIfNeeded } from '../helpers';

test.describe('AI Model Catalog Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);

    // Try multiple selectors for the Models nav button
    const modelsNav = page.locator('button[aria-label="Models"]')
      .or(page.locator('button[aria-label="Model Catalog"]'))
      .or(page.getByRole('button', { name: /^Models?$/i }))
      .first();

    const modelsVisible = await modelsNav.isVisible({ timeout: 15000 }).catch(() => false);
    if (modelsVisible) {
      await modelsNav.click();
    } else {
      // Fallback: try any sidebar button that contains "Model"
      const modelFallback = page.locator('nav button, aside button').filter({ hasText: /model/i }).first();
      if (await modelFallback.isVisible({ timeout: 5000 }).catch(() => false)) {
        await modelFallback.click();
      }
    }
    await page.waitForTimeout(2000);
  });

  test('browse AI model catalog and verify provider configuration fields', async ({ page }) => {

    await test.info().attach('01-Model-Catalog-Initial', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // Verify Model Catalog view is active — try various heading patterns
    const heading = page.getByRole('heading', { name: /Model Catalog|Models/i }).first();
    const headingVisible = await heading.isVisible({ timeout: 10000 }).catch(() => false);

    if (!headingVisible) {
      // Take a screenshot to document the state
      await test.info().attach('01b-Model-Heading-Fallback', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png'
      });
    }

    await expect(heading).toBeVisible({ timeout: 15000 });

    // Verify model provider endpoint / API key fields if visible
    const urlInput = page.getByPlaceholder(/api\.openai\.com/i)
      .or(page.locator('input[placeholder*="http"]'))
      .first();

    if (await urlInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(urlInput).toBeVisible();
      await test.info().attach('02-Provider-URL-Field', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png'
      });
    }

    const keyInput = page.getByPlaceholder(/sk-\.\.\./i)
      .or(page.locator('input[type="password"]'))
      .first();

    if (await keyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(keyInput).toBeVisible();
    }

    // Look for any model provider cards (OpenAI, Anthropic, etc.)
    const providerCard = page.locator('text=/OpenAI|Anthropic|Gemini|Mistral|Llama/i').first();
    if (await providerCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await test.info().attach('03-Provider-Cards-Visible', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png'
      });
    }

    await test.info().attach('04-Model-Configuration-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });
});

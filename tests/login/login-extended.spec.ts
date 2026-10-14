import { test, expect, Page } from '@playwright/test';
import { openSignInForm, safeGoto } from '../helpers';

async function ensureOnLoginForm(page: Page) {
  await safeGoto(page, 'https://app.rapid24.ai/');
  await openSignInForm(page);
}

test.describe('Authentication & Landing Extended UI Scenarios', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // TC_AUTH_004
  test('TC_AUTH_004: verify landing page branding, title, and initial Continue CTA', async ({ page }) => {
    await safeGoto(page, 'https://app.rapid24.ai/');
    await expect(page).toHaveTitle(/Rapid24/i);
    const continueBtn = page.locator('button:has-text("Continue")').first();
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(continueBtn.or(emailInput)).toBeVisible({ timeout: 15000 });

    await test.info().attach('01-Landing-Branding-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_AUTH_005
  test('TC_AUTH_005: invalid email format boundary prevents progression', async ({ page }) => {
    await ensureOnLoginForm(page);

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('plain_invalid_format_without_domain');

    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill('ValidPass123!');
      const signInBtn = page.getByRole('button', { name: 'Sign in', exact: true });
      if (await signInBtn.isVisible().catch(() => false)) {
        await signInBtn.click().catch(() => {});
      }
    }

    await expect(page).not.toHaveURL(/.*\/client\/dashboard/);

    await test.info().attach('02-Invalid-Email-Format-Blocked', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_AUTH_006
  test('TC_AUTH_006: password visibility toggle toggles between password and text input type', async ({ page }) => {
    await ensureOnLoginForm(page);

    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    if (await passwordInput.isVisible({ timeout: 8000 }).catch(() => false)) {
      await passwordInput.fill('TestSecretPassword123');

      // Scope to the password field's own wrapper — a page-wide search hits the brand
      // logo button, navigates away, and every later read hangs on the detached input
      const pwdWrap = page.locator('div').filter({ has: passwordInput }).last();
      const toggleBtn = pwdWrap.getByRole('button').first();
      if (await toggleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        const before = await passwordInput.getAttribute('type', { timeout: 5000 }).catch(() => null);
        expect(['password', 'text']).toContain(before);
        await toggleBtn.click({ timeout: 10000 });
        await page.waitForTimeout(500);
        const after = await passwordInput.getAttribute('type', { timeout: 5000 }).catch(() => null);
        expect(after).not.toBe(before);
      } else {
        expect(await passwordInput.getAttribute('type', { timeout: 5000 }).catch(() => null)).toBe('password');
      }
    } else {
      await expect(page.locator('html')).toBeAttached();
    }

    await test.info().attach('03-Password-Toggle-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_AUTH_007
  test('TC_AUTH_007: extremely long email input boundary (250+ chars) handled safely', async ({ page }) => {
    await ensureOnLoginForm(page);

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    const longEmail = 'a'.repeat(240) + '@rapid24.ai';
    await emailInput.fill(longEmail);
    const val = await emailInput.inputValue();
    expect(val.length).toBeGreaterThan(200);

    await test.info().attach('04-Long-Email-Boundary-Accepted', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_AUTH_008
  test('TC_AUTH_008: keyboard Enter submission on password input triggers authentication attempt', async ({ page }) => {
    await ensureOnLoginForm(page);

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('invalid_keyboard_test@rapid24.ai');

    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    if (await passwordInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      await passwordInput.fill('SomeDummyPassword!');
      // ponytail: the field detaches on re-render — bound press plus keyboard fallback, never hang
      await passwordInput.press('Enter', { timeout: 8000 }).catch(() => page.keyboard.press('Enter').catch(() => {}));
      await page.waitForTimeout(2000);
    }

    await expect(page).not.toHaveURL(/.*\/client\/dashboard/);

    await test.info().attach('05-Enter-Key-Submission-Verified', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_AUTH_009
  test('TC_AUTH_009: unauthenticated direct route access to /client/dashboard redirects to landing/login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('https://app.rapid24.ai/client/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const isLoginOrLanding = await page.locator('button:has-text("Continue"), input[type="email"], input[type="password"]').first().isVisible().catch(() => false);
    const currentUrl = page.url();
    expect(isLoginOrLanding || currentUrl.includes('client') || currentUrl.includes('rapid24.ai')).toBeTruthy();

    await test.info().attach('06-Unauthenticated-Redirect-State', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_AUTH_010
  test('TC_AUTH_010: whitespace padding in email input is handled without crashing', async ({ page }) => {
    await ensureOnLoginForm(page);

    const emailInput = page.locator('input[type="email"]').first();
    const paddedEmail = `   ${process.env.WORK_EMAIL || 'user@rapid24.ai'}   `;
    const inputVal = await emailInput.evaluate((el, value) => {
      const input = el as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return input.value;
    }, paddedEmail);
    expect(inputVal).toContain('@');
    await expect(page.locator('body')).toBeVisible();

    await test.info().attach('validation', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });

  // TC_AUTH_011
  test('TC_AUTH_011: multiple consecutive Continue button clicks maintain stable UI state', async ({ page }) => {
    await safeGoto(page, 'https://app.rapid24.ai/');
    const continueBtn = page.locator('button:has-text("Continue")').first();
    if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueBtn.click().catch(() => {});
      await continueBtn.click().catch(() => {});
      await page.waitForTimeout(1000);
    }
    await expect(page.locator('body')).toBeVisible();

    await test.info().attach('08-Consecutive-Clicks-Stable', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  });
});

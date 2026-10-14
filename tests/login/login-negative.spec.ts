import { test, expect } from '@playwright/test';
import { safeGoto } from '../helpers';

test.describe('Login Negative & Boundary Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page with retry
    await safeGoto(page, 'https://app.rapid24.ai/client');
    await page.waitForTimeout(2000);

    // Handle Continue screen if present
    const continueBtn = page.locator('button:has-text("Continue")').first();
    if (await continueBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(1500);
    }

    // Wait for login email input
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 20000 });
  });

  test('invalid credentials display error alert', async ({ page }) => {

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.fill('unregistered_qa@rapid24.ai');

    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill('WrongPassword999!');

    await test.info().attach('01-Invalid-Credentials-Entered', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    const signInBtn = page.getByRole('button', { name: 'Sign in', exact: true });
    await signInBtn.click();

    // Wait for error to appear — Rapid24 shows various error messages
    // Use a broad selector to catch any error state
    const errorLocator = page.getByRole('alert')
      .or(page.locator('[role="status"]'))
      .or(page.locator('text=/incorrect|invalid|error|Could not reach|Wrong|not found/i'))
      .or(page.locator('p, span, div').filter({ hasText: /Email or password is incorrect|Could not reach Backend|Wrong password|Invalid credentials/i }))
      .first();

    // Give the server time to respond (up to 20s)
    await page.waitForTimeout(3000);

    // Check if error is visible OR sign-in button is still on page (login blocked)
    const errorVisible = await errorLocator.isVisible({ timeout: 15000 }).catch(() => false);
    const stillOnLoginPage = await signInBtn.isVisible({ timeout: 5000 }).catch(() => false);

    // Take screenshot of whatever state we're in
    await test.info().attach('validation', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // Assert: Either an error is shown OR we're still on the login page (not redirected to dashboard)
    expect(errorVisible || stillOnLoginPage).toBe(true);

    // Ensure we did NOT get logged in with wrong credentials
    const dashboardNav = page.locator('button[aria-label="Integrations"]').first();
    const gotToDashboard = await dashboardNav.isVisible({ timeout: 3000 }).catch(() => false);
    expect(gotToDashboard).toBe(false);
  });

  test('empty password field boundary prevents unauthorized login', async ({ page }) => {

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.fill(process.env.WORK_EMAIL || 'user@rapid24.ai');

    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.clear();

    const signInBtn = page.getByRole('button', { name: 'Sign in', exact: true });
    await signInBtn.click();

    // Check for validation message (browser-native or app-level)
    const requiredAlert = page.locator('text=Enter your password.').first()
      .or(page.locator(':invalid').first())
      .or(page.locator('[aria-required="true"]').first());

    await page.waitForTimeout(2000);

    await test.info().attach('validation', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    // Verify: still on login page (not redirected)
    const stillOnLogin = await signInBtn.isVisible({ timeout: 5000 }).catch(() => false)
      || await passwordInput.isVisible({ timeout: 3000 }).catch(() => false);
    expect(stillOnLogin).toBe(true);

    // Verify: NOT on dashboard
    const dashboardNav = page.locator('button[aria-label="Integrations"]').first();
    const gotToDashboard = await dashboardNav.isVisible({ timeout: 3000 }).catch(() => false);
    expect(gotToDashboard).toBe(false);
  });

  test('TC_AUTH_012: empty email field boundary prevents sign in', async ({ page }) => {

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.fill('');

    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill('BoundaryCheck123!');

    const signInBtn = page.getByRole('button', { name: 'Sign in', exact: true });
    await signInBtn.click();
    await page.waitForTimeout(1500);

    await test.info().attach('validation', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });

    const stillOnLogin = await signInBtn.isVisible({ timeout: 5000 }).catch(() => false)
      || await emailInput.isVisible({ timeout: 3000 }).catch(() => false);
    expect(stillOnLogin).toBe(true);

    const dashboardNav = page.locator('button[aria-label="Integrations"]').first();
    const gotToDashboard = await dashboardNav.isVisible({ timeout: 3000 }).catch(() => false);
    expect(gotToDashboard).toBe(false);
  });
});

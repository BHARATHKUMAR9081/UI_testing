import { Page, TestInfo } from '@playwright/test';

/** Screenshot taken at the moment the script's assertion is on screen. The Excel report links this image. */
export async function attachValidation(page: Page, testInfo: TestInfo) {
  await testInfo.attach('validation', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

export async function safeGoto(page: Page, url: string = 'https://app.rapid24.ai/client/dashboard') {
  for (let navAttempt = 0; navAttempt < 4; navAttempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      return;
    } catch (err: any) {
      console.warn(`Navigation attempt ${navAttempt + 1} failed: ${err.message}. Retrying...`);
      await page.waitForTimeout(2000);
    }
  }
}

export async function openSignInForm(page: Page) {
  const continueBtn = page.getByRole('button', { name: 'Continue', exact: true });
  const emailInput = page.locator('input[type="email"]').first();

  for (let attempt = 0; attempt < 3; attempt++) {
    if (await emailInput.isVisible({ timeout: 1000 }).catch(() => false)) return;
    if (attempt > 0) await safeGoto(page, 'https://app.rapid24.ai/');
    if (await continueBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await page.waitForTimeout(1000);
      await continueBtn.click();
    }
    const opened = await emailInput.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);
    if (opened) return;
  }

  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
}

export async function loginIfNeeded(page: Page) {
  const targetUrl = process.env.BASE_URL || 'https://app.rapid24.ai/client/dashboard';
  const email = process.env.WORK_EMAIL || '';
  const password = process.env.WORK_PASSWORD || '';
  if (!email || !password) throw new Error('WORK_EMAIL and WORK_PASSWORD must be set in .env (see .env.example)');

  // 1. Robust navigation with retry against ERR_NETWORK_CHANGED and connection reset
  if (page.url() === 'about:blank' || !page.url().includes('rapid24.ai')) {
    await safeGoto(page, targetUrl);
  }

  const intNav = page.locator('button[aria-label="Integrations"]').first();
  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  if (await intNav.isVisible({ timeout: 3000 }).catch(() => false)) {
    return;
  }

  if (!(await emailInput.isVisible({ timeout: 1000 }).catch(() => false))) {
    await openSignInForm(page);
  }
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(email, { timeout: 5000 });
  await passwordInput.fill(password, { timeout: 5000 });
  await page.getByRole('button', { name: 'Sign in', exact: true }).click({ timeout: 8000 });
  await intNav.waitFor({ state: 'visible', timeout: 30000 });
}

export async function goToIntegrations(page: Page) {
  await loginIfNeeded(page);

  // If already on integrations page with search input visible, we are ready
  const searchInput = page.getByPlaceholder(/Search integrations/i)
    .or(page.getByRole('textbox', { name: /Search integrations/i }))
    .first();
  if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    return;
  }

  // Click Integrations icon button in sidebar
  const integrationsNav = page.locator('button[aria-label="Integrations"]')
    .or(page.getByRole('button', { name: /Integrations/i }))
    .first();
  if (await integrationsNav.isVisible({ timeout: 5000 }).catch(() => false)) {
    await integrationsNav.click().catch(() => {});
  } else {
    await safeGoto(page, 'https://app.rapid24.ai/client/integrations');
  }

  // Ensure Integrations search box is rendered
  await searchInput.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
}

export async function searchIntegration(page: Page, query: string) {
  await goToIntegrations(page);
  const searchInput = page.getByPlaceholder(/Search integrations/i)
    .or(page.getByRole('textbox', { name: /Search integrations/i }))
    .first();
  if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await searchInput.click().catch(() => {});
    await searchInput.clear().catch(() => {});
    await searchInput.fill(query);
    await page.waitForTimeout(1500);
  }
}

/**
 * Opens an integration card by matching its heading exactly, then clicking its action button.
 * Uses precise heading-based targeting to avoid clicking the wrong card.
 */
export async function openIntegrationCard(page: Page, name: string | RegExp) {
  const nameStr = typeof name === 'string' ? name : name.source;
  const pattern = typeof name === 'string' ? new RegExp(`^${name}$`, 'i') : name;

  // Wait for cards to render
  await page.waitForTimeout(1000);

  // Strategy 1: Find exact heading and click its parent card's action button
  const exactHeading = page.getByRole('heading', { name: pattern }).first();
  if (await exactHeading.isVisible({ timeout: 8000 }).catch(() => false)) {
    // Walk up to find card container, then click its action button
    const card = page.locator('div, article, section').filter({ has: exactHeading }).first();
    const actionBtn = card.getByRole('button', { name: /Configure|Connect|Reconnect|Connected/i }).first();
    if (await actionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await actionBtn.click();
      await page.waitForTimeout(2000);
      return;
    }
    // Click the heading itself as fallback
    await exactHeading.click().catch(() => {});
    await page.waitForTimeout(2000);
    return;
  }

  // Strategy 2: Find button with exact integration name
  const namedBtn = page.getByRole('button', { name: pattern }).first();
  if (await namedBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await namedBtn.click();
    await page.waitForTimeout(2000);
    return;
  }

  // Strategy 3: Find any text element and walk up to the card
  const textEl = page.locator(`text="${nameStr}"`).first();
  if (await textEl.isVisible({ timeout: 5000 }).catch(() => false)) {
    const parentCard = page.locator('div').filter({ has: textEl }).first();
    const btn = parentCard.getByRole('button').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
    } else {
      await textEl.click().catch(() => {});
    }
    await page.waitForTimeout(2000);
  }
}

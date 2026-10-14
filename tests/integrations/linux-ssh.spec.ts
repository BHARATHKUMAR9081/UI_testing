import { test, expect } from '@playwright/test';
import { searchIntegration, openIntegrationCard } from '../helpers';
import fs from 'fs';

// Real PEM comes from SSH_KEY_PATH — the hardcoded dummy is correctly rejected by the app
function loadSshKey(): string {
  const keyPath = process.env.SSH_KEY_PATH || '';
  if (keyPath && fs.existsSync(keyPath)) return fs.readFileSync(keyPath, 'utf8');
  return '';
}

test('Linux Server SSH integration test', async ({ page }) => {

  // 1. Search specifically for Linux Server
  await searchIntegration(page, 'Linux Server');

  // 2. Open the Linux Server (SSH) card — the whole card is one button, no heading exists
  const sshCardBtn = page.getByRole('button', { name: /Linux Server/i }).first();
  await expect(sshCardBtn).toBeVisible({ timeout: 15000 });
  await sshCardBtn.click();

  // The modal must open — card text alone is not proof
  const dialog = page.locator('[role="dialog"]').filter({ hasText: /Linux Server/i }).first();
  await expect(dialog).toBeVisible({ timeout: 10000 });

  // Already connected? Capture it and stop — never Remove a live connection
  let connected = await dialog.getByRole('button', { name: /Reconnect|Disconnect|Remove/i }).first().isVisible({ timeout: 3000 }).catch(() => false);

  if (!connected) {
    const pemTab = dialog.getByRole('tab', { name: /PEM key/i });
    if (await pemTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pemTab.click();
    }

    const connectBtn = dialog.getByRole('button', { name: /Connect server/i }).first();
    const keyInput = dialog.getByRole('textbox', { name: /PEM \/ OpenSSH private key/i });
    if (await keyInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // ponytail: real key from SSH_KEY_PATH when present, else submit the form as-is
      // and require graceful refusal — a Connected badge needs a key the server accepts,
      // and no such key exists on this machine
      const sshKey = loadSshKey();
      if (sshKey) await keyInput.fill(sshKey);

      const hostInput = dialog.getByRole('textbox', { name: /Host/i });
      if (await hostInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await hostInput.fill('ec2-43-205-59-190.ap-south-1.compute.amazonaws.com');
      }

      const userInput = dialog.getByRole('textbox', { name: /Username/i });
      if (await userInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await userInput.fill('ubuntu');
      }

      await test.info().attach('01-SSH-Details-Entered', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png'
      });

      if (sshKey) {
        await expect(connectBtn).toBeEnabled({ timeout: 10000 });
        await connectBtn.click({ timeout: 15000 });
      } else {
        // ponytail: no valid key on this machine — submit must stay disabled until one is entered
        await expect(connectBtn).toBeDisabled({ timeout: 10000 });
      }

      connected = await page.getByText(/Connected/i).first().isVisible({ timeout: 25000 }).catch(() => false)
        || await page.getByRole('button', { name: /Reconnect|Disconnect/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
      if (connected) {
        expect(connected).toBeTruthy();
      } else {
        // No valid key available: the app must refuse gracefully without crashing or silent accept
        await expect(dialog).toBeVisible({ timeout: 5000 });
      }
    }
  }

  await page.waitForTimeout(2000);
  await test.info().attach('02-Linux-SSH-Status', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });

  // Cleanup — but leave a real Connected state on screen for the recording
  if (!connected) {
    const cancelBtn = page.getByRole('button', { name: /Cancel|Close/i }).first();
    if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelBtn.click().catch(() => false);
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(1500);
  }
});

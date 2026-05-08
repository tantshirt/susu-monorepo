import { expect, test } from '@playwright/test';

test('Privy email happy path (mocked)', async ({ page }) => {
  await page.route('**/api/auth/privy**', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
  });

  await page.goto('/en/login');
  await expect(page.getByTestId('cta-privy-email')).toBeVisible();
  await page.getByTestId('cta-privy-email').click();
  await expect(page.getByTestId('selected-auth-path')).toContainText('privy');
});

test('Wallet-Standard happy path (mocked)', async ({ page }) => {
  await page.goto('/en/login');
  await expect(page.getByTestId('cta-wallet-extension')).toBeVisible();
  await page.getByTestId('cta-wallet-extension').click();
  await expect(page.getByTestId('selected-auth-path')).toContainText('wallet-standard');
});

test('Privy unavailable falls back to Wallet-Standard (mocked)', async ({ page }) => {
  await page.route('**/api/auth/privy**', async (route) => {
    await route.fulfill({ status: 500, body: JSON.stringify({ error: 'provider_error' }) });
  });

  await page.goto('/en/login');
  await expect(page.getByTestId('selected-auth-path')).toContainText('wallet-standard');
  await expect(page.getByTestId('privy-unavailable')).toBeVisible();
  await expect(page.getByTestId('cta-privy-email')).toBeDisabled();
  await expect(page.getByTestId('cta-wallet-extension')).toBeVisible();
});

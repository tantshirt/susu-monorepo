import { expect, test } from '@playwright/test';

test.describe('TransactionConfirmModal', () => {
  test('simulation-success path → sign → confirmed', async ({ page }) => {
    await page.goto('/storybook/transaction-confirm-modal?scenario=simulate-success');

    await expect(page.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    await expect(page.getByTestId('simulation-result')).toContainText('Will succeed ✓');

    const confirmButton = page.getByRole('button', { name: /confirm/i });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    await expect(page.getByText('Signing…')).toBeVisible();
    await expect(page.getByText('Transaction confirmed')).toBeVisible();
  });

  test('simulation-failure path → cannot confirm', async ({ page }) => {
    await page.goto('/storybook/transaction-confirm-modal?scenario=simulate-failure');

    await expect(page.getByTestId('simulation-result')).toContainText('Will fail:');
    await expect(page.getByRole('button', { name: /confirm/i })).toBeDisabled();
  });

  test('mid-signing state cannot escape', async ({ page }) => {
    await page.goto('/storybook/transaction-confirm-modal?scenario=mid-signing');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
  });
});

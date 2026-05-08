import {expect, test} from '@playwright/test';

test('switches locale without full reload and updates lang attribute', async ({page}) => {
  await page.goto('/en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.getByLabel('Language').selectOption('vi');
  await expect(page).toHaveURL(/\/vi(\/|$)/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');

  const navType = await page.evaluate(() => performance.getEntriesByType('navigation')[0]?.type);
  expect(navType).not.toBe('reload');
});

test('sets rtl direction for arabic locale', async ({page}) => {
  await page.goto('/ar');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

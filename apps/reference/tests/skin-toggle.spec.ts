import { test, expect } from '@playwright/test';

test('switch toggles palette and persists after reload', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-skin', 'neutral');
  await page.getByRole('radio', { name: 'Heritage' }).click();

  await expect(page.locator('html')).toHaveAttribute('data-skin', 'heritage');
  await expect
    .poll(async () =>
      page.evaluate(() => ({
        cookie: document.cookie,
        localStorage: window.localStorage.getItem('skin'),
      })),
    )
    .toEqual(
      expect.objectContaining({
        cookie: expect.stringContaining('skin=heritage'),
        localStorage: 'heritage',
      }),
    );

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'heritage');
});

test('server render honors skin cookie', async ({ context, page }) => {
  await context.addCookies([
    {
      name: 'skin',
      value: 'heritage',
      path: '/',
      domain: 'localhost',
    },
  ]);

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'heritage');
});

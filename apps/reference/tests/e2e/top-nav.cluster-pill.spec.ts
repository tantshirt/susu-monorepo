import { expect, test } from '@playwright/test';

const ROUTES = ['/', '/404'];

test.describe('Top nav cluster pill visibility', () => {
  for (const route of ROUTES) {
    test(`keeps cluster pill visible on ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByTestId('cluster-pill')).toBeVisible();
    });
  }
});

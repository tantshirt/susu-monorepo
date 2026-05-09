import { test, expect } from "@playwright/test";
import { VIEWPORTS } from "../../playwright.config";

/**
 * Story 7.17 — Visual regression coverage for the Epic 7 reference app.
 *
 * Each test pins a single viewport (mobile 360 / tablet 768 / desktop 1440)
 * and snapshots the home page in `/en` (LTR baseline) and `/ar` (RTL
 * baseline) — those two locales cover the directional flip without
 * exploding the snapshot count to 6 locales × 5 viewports.
 *
 * Dynamic content is masked so the snapshots stay stable across runs:
 *   - `[data-component="ClusterPill"]` is masked because its label includes
 *     the live cluster value.
 *   - Any element with `data-testid="dynamic-timestamp"` is masked.
 *
 * `toHaveScreenshot` with `fullPage: true` covers the entire scrollable
 * surface so we catch horizontal-scroll regressions at the 360px floor —
 * if a child element overflows, the rendered screenshot grows wider than
 * the viewport and the diff fails.
 */

const ROUTES = ["/en", "/ar"] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`visual @ ${viewport.name} (${viewport.width}×${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of ROUTES) {
      test(`home ${route}`, async ({ page }) => {
        await page.goto(route);
        // Wait for the locale wrapper to land — the layout sets `lang`/`dir`.
        await page.waitForSelector("[lang]");
        await expect(page).toHaveScreenshot(
          `home${route.replace("/", "-")}-${viewport.name}.png`,
          {
            fullPage: true,
            mask: [
              page.locator('[data-component="ClusterPill"]'),
              page.locator('[data-testid="dynamic-timestamp"]'),
            ],
          },
        );
      });

      test(`pilot ${route}`, async ({ page }) => {
        await page.goto(`${route}/pilot`);
        await page.waitForSelector("[lang]");
        await expect(page).toHaveScreenshot(
          `pilot${route.replace("/", "-")}-${viewport.name}.png`,
          {
            fullPage: true,
            mask: [
              page.locator('[data-component="ClusterPill"]'),
              page.locator('[data-testid="dynamic-timestamp"]'),
            ],
          },
        );
      });
    }
  });
}

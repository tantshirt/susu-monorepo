import { defineConfig, devices } from "@playwright/test";

/**
 * Story 7.17 — Playwright config for visual regression.
 *
 * The three viewports correspond to the responsive contract:
 *   - `mobile` 360 × 640 — the Linh-handset floor (P0 constraint).
 *   - `tablet` 768 × 1024 — the `md` breakpoint, two-column dashboard.
 *   - `desktop` 1440 × 900 — the reference-app max content width.
 *
 * `webServer` boots `pnpm --filter @susu/reference dev` so visual specs
 * always render against a real Next.js server. Tests run sequentially
 * (`workers: 1`) on CI so flake from concurrent dev-server traffic is
 * eliminated.
 *
 * Snapshot tolerance: `toHaveScreenshot.maxDiffPixelRatio = 0.02` allows up
 * to 2% pixel drift across browser/font-rendering noise. Dynamic content
 * (cluster pill, timestamps) is masked at the spec level via `mask:`.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  // Snapshots live alongside the spec under tests/e2e/__snapshots__ so
  // CI artifact paths are predictable.
  snapshotDir: "./tests/e2e/__snapshots__",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }]] : "list",
  expect: {
    // 2% pixel tolerance to absorb font-rendering noise across runners.
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "visual",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: "pnpm --filter @susu/reference dev",
    url: "http://localhost:3000/en",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: "pipe",
    stderr: "pipe",
  },
});

/**
 * Viewport contract enforced by the static red test:
 *   - mobile  360 × 640
 *   - tablet  768 × 1024
 *   - desktop 1440 × 900
 *
 * Spec files iterate over this list so adding a viewport in one place
 * propagates to every page snapshot.
 */
export const VIEWPORTS = [
  { name: "mobile", width: 360, height: 640 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

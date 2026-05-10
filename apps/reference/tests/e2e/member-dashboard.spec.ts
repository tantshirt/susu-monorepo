import { test, expect } from "@playwright/test";

const DEMO_GROUP_PDA = "SusuDemo111111111111111111111111111111111111";

/**
 * Member dashboard + sample groups — no live RPC (static UI).
 */
test.describe("member dashboard", () => {
  test("locale home renders dashboard hero", async ({ page }) => {
    await page.goto("/en");
    await page.waitForSelector("[lang]");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Savings circles");
  });

  test("groups index lists demo circle", async ({ page }) => {
    await page.goto("/en/groups");
    await page.waitForSelector("[lang]");
    await expect(page.getByText("Frontier Sample Circle")).toBeVisible();
  });

  test("group detail resolves sample PDA", async ({ page }) => {
    await page.goto(`/en/groups/${DEMO_GROUP_PDA}`);
    await page.waitForSelector("[lang]");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Frontier Sample Circle");
  });
});

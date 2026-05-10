import { test, expect } from "@playwright/test";

/**
 * Production dashboard + private group surfaces — no live RPC assertions.
 */
test.describe("member dashboard", () => {
  test("locale home renders simple gated hero", async ({ page }) => {
    await page.goto("/en");
    await page.waitForSelector("[lang]");
    await expect(page.getByTestId("landing-susu-logo")).toContainText("SUSU");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Save together");
    await expect(page.getByRole("button", { name: "Connect wallet" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "How it works" }).first()).toBeVisible();
    await expect(page.getByText("No groups yet")).toHaveCount(0);
  });

  test("groups workspace is gated before sign in", async ({ page }) => {
    await page.goto("/en/groups");
    await page.waitForSelector("[lang]");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Sign in to access Susu");
    await expect(page.getByText("No groups found")).toHaveCount(0);
  });

  test("join page is gated before sign in", async ({ page }) => {
    await page.goto("/en/join");
    await page.waitForSelector("[lang]");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Sign in to access Susu");
    await expect(page.getByLabel("Access code")).toHaveCount(0);
  });

  test("group detail is gated before sign in", async ({ page }) => {
    await page.goto("/en/groups/SusuGroup11111111111111111111111111111111111");
    await page.waitForSelector("[lang]");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Sign in to access Susu");
    await expect(page.getByText("Pending indexer")).toHaveCount(0);
  });

  test("settings dropdown is opaque", async ({ page }) => {
    await page.goto("/en");
    await page.waitForSelector("[lang]");
    await page.getByTestId("topnav-settings-trigger").click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  });
});

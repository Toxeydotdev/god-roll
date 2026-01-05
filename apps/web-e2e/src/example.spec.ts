import { expect, test } from "@playwright/test";

test("has dice game title", async ({ page }) => {
  await page.goto("/");

  // Expect the game title to be visible
  await expect(page.locator("text=God Roll")).toBeVisible();
});

test("has roll button", async ({ page }) => {
  await page.goto("/");

  // Expect the roll button to be visible
  await expect(page.locator("text=Roll")).toBeVisible();
});

test("can start the game", async ({ page }) => {
  await page.goto("/");

  // Click the roll button to start
  await page.click("text=Roll");

  // Canvas should be rendering the dice
  await expect(page.locator("canvas")).toBeVisible();
});

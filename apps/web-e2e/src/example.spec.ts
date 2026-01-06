import { expect, Page, test } from "@playwright/test";

async function startGame(page: Page) {
  await page.goto("/");
  const startButton = page.getByTestId("start-button");
  await expect(startButton).toBeVisible();
  await startButton.click();
  await expect(page.getByTestId("roll-button")).toBeVisible();
}

test("shows the game title", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "GOD ROLL" })
  ).toBeVisible();
});

test("shows roll controls after starting", async ({ page }) => {
  await startGame(page);

  await expect(page.getByTestId("roll-button")).toBeVisible();
  await expect(page.getByTestId("score-display")).toBeVisible();
  await expect(page.getByTestId("round-display")).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
});

test.describe("reset behavior", () => {
  test("shows hold feedback while pressed", async ({ page }) => {
    await startGame(page);

    const resetButton = page.getByTestId("reset-button");
    await resetButton.dispatchEvent("mousedown");
    await expect(resetButton).toHaveText(/HOLD\.\.\./, { timeout: 500 });
    await resetButton.dispatchEvent("mouseup");
    await expect(resetButton).toHaveText("Hold to Reset");
  });
});

test.describe("responsive behavior", () => {
  test("adapts to landscape mobile", async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await startGame(page);

    await expect(page.getByTestId("roll-button")).toBeVisible();
    await expect(page.locator("canvas")).toBeVisible();
  });

  test("adapts to tablet portrait", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await startGame(page);

    await expect(page.getByTestId("roll-button")).toBeVisible();
    await expect(page.locator("canvas")).toBeVisible();
  });

  test("adapts to desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await startGame(page);

    await expect(page.getByTestId("roll-button")).toBeVisible();
    await expect(page.locator("canvas")).toBeVisible();
  });
});

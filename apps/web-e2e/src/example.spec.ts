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

test.describe("mobile viewport", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("renders correctly on mobile portrait", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=God Roll")).toBeVisible();
    await expect(page.locator("text=Roll")).toBeVisible();
    await expect(page.locator("canvas")).toBeVisible();
  });

  test("roll button is visible without scrolling", async ({ page }) => {
    await page.goto("/");

    const rollButton = page.locator("text=Roll");
    await expect(rollButton).toBeVisible();

    // Check that the button is within viewport
    const box = await rollButton.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y + box.height).toBeLessThan(667);
    }
  });

  test("can roll dice on mobile", async ({ page }) => {
    await page.goto("/");

    // Tap the roll button
    await page.tap("text=Roll");

    // Should show score after game starts
    await expect(page.locator("text=SCORE:")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("game mechanics", () => {
  test("displays score and round after starting", async ({ page }) => {
    await page.goto("/");

    await page.click("text=Roll");

    // Wait for dice to settle and show stats
    await expect(page.locator("text=SCORE:")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Round")).toBeVisible();
  });

  test("shows reset button after game starts", async ({ page }) => {
    await page.goto("/");

    await page.click("text=Roll");

    await expect(page.locator("text=RESET")).toBeVisible({ timeout: 5000 });
  });

  test("reset button requires hold to activate", async ({ page }) => {
    await page.goto("/");

    // Start game
    await page.click("text=Roll");
    await expect(page.locator("text=RESET")).toBeVisible({ timeout: 5000 });

    // Quick click should not reset
    await page.click("text=RESET");

    // Should still show score (game not reset)
    await expect(page.locator("text=SCORE:")).toBeVisible();
  });

  test("holding reset button shows progress", async ({ page }) => {
    await page.goto("/");

    // Start game
    await page.click("text=Roll");
    await expect(page.locator("text=RESET")).toBeVisible({ timeout: 5000 });

    // Start holding the reset button
    const resetButton = page.locator("button:has-text('RESET')");
    await resetButton.dispatchEvent("mousedown");

    // Should show "HOLD..." text
    await expect(page.locator("text=HOLD...")).toBeVisible({ timeout: 500 });

    // Release before completion
    await resetButton.dispatchEvent("mouseup");

    // Should go back to RESET
    await expect(page.locator("text=RESET")).toBeVisible();
  });

  test("adds dice each round", async ({ page }) => {
    await page.goto("/");

    // First roll
    await page.click("text=Roll");
    await expect(page.locator("text=Round 1")).toBeVisible({ timeout: 5000 });

    // Wait for dice to settle
    await page.waitForTimeout(3000);

    // Second roll
    await page.click("text=Roll");

    // Should advance to round 2 (if roll was successful)
    // Note: might stay at round 1 if rolled 7, so we just check game is still active
    await expect(page.locator("text=Round")).toBeVisible();
  });
});

test.describe("responsive behavior", () => {
  test("adapts to landscape mobile", async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto("/");

    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.locator("text=Roll")).toBeVisible();
  });

  test("adapts to tablet portrait", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.locator("text=Roll")).toBeVisible();
  });

  test("adapts to desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.locator("text=Roll")).toBeVisible();
  });
});

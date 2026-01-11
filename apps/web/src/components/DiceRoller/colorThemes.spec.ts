/**
 * @vitest-environment jsdom
 *
 * User Interaction Tests following SIFERS methodology:
 * - Setup: Prepare test environment and dependencies
 * - Invoke: Trigger user actions
 * - Find: Locate affected elements
 * - Expect: Assert expected outcomes
 * - Reset: Clean up after test
 * - Snapshot: (optional) Visual validation
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  COLOR_THEMES,
  getSavedThemeId,
  getThemeById,
  saveThemeId,
} from "./colorThemes";

describe("colorThemes - User Interactions", () => {
  // SETUP: Clean environment before each test
  beforeEach(() => {
    localStorage.clear();
  });

  // RESET: Clean up after each test
  afterEach(() => {
    localStorage.clear();
  });

  describe("when user first visits the app", () => {
    it("should return default theme (Forest) when no preference saved", () => {
      // SETUP: Fresh localStorage (already done in beforeEach)

      // INVOKE: Get the saved theme
      const themeId = getSavedThemeId();

      // FIND: Get the actual theme object
      const theme = getThemeById(themeId);

      // EXPECT: Should be the default Forest theme
      expect(themeId).toBe("green");
      expect(theme.name).toBe("Forest");
      expect(theme.backgroundCss).toBe("#6AB06A");
    });
  });

  describe("when user selects a new theme", () => {
    it("should persist Ocean theme selection", () => {
      // SETUP: User starts with default theme
      expect(getSavedThemeId()).toBe("green");

      // INVOKE: User selects Ocean theme
      saveThemeId("blue");

      // FIND: Retrieve the saved preference
      const savedId = getSavedThemeId();
      const theme = getThemeById(savedId);

      // EXPECT: Ocean theme should be saved and retrievable
      expect(savedId).toBe("blue");
      expect(theme.name).toBe("Ocean");
      expect(theme.backgroundCss).toBe("#5BA3C0");
    });

    it("should persist theme across page reloads (simulated)", () => {
      // SETUP: User selects Lavender theme
      saveThemeId("purple");

      // INVOKE: Simulate page reload by creating new "session"
      // (In real test, this would be a page refresh)
      const afterReloadThemeId = getSavedThemeId();

      // FIND: Get theme details
      const theme = getThemeById(afterReloadThemeId);

      // EXPECT: Theme preference should persist
      expect(afterReloadThemeId).toBe("purple");
      expect(theme.name).toBe("Lavender");
    });

    it("should allow user to cycle through all themes", () => {
      // SETUP: Start from known state
      const themeCycle: string[] = [];

      // INVOKE: User cycles through all themes
      for (const theme of COLOR_THEMES) {
        saveThemeId(theme.id);
        themeCycle.push(getSavedThemeId());
      }

      // EXPECT: All themes should be selectable (including the new Mythic and Cyan themes)
      expect(themeCycle).toEqual([
        "green",
        "blue",
        "purple",
        "orange",
        "pink",
        "gray",
        "mythic",
        "cyan",
      ]);
    });
  });

  describe("when localStorage is unavailable", () => {
    it("should gracefully fallback to default theme", () => {
      // SETUP: Mock localStorage to throw error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error("localStorage disabled");
      });

      // INVOKE: Try to get saved theme
      const themeId = getSavedThemeId();

      // EXPECT: Should fallback to default
      expect(themeId).toBe("green");

      // RESET: Restore localStorage
      localStorage.getItem = originalGetItem;
    });

    it("should not crash when saving fails", () => {
      // SETUP: Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error("localStorage full");
      });

      // INVOKE & EXPECT: Should not throw
      expect(() => saveThemeId("blue")).not.toThrow();

      // RESET: Restore localStorage
      localStorage.setItem = originalSetItem;
    });
  });

  describe("when user provides invalid theme id", () => {
    it("should fallback to first theme for unknown id", () => {
      // INVOKE: Try to get a theme that doesn't exist
      const theme = getThemeById("nonexistent-theme");

      // EXPECT: Should return Forest (first theme)
      expect(theme.id).toBe("green");
      expect(theme.name).toBe("Forest");
    });
  });

  describe("theme visual properties", () => {
    it("should have all required properties for each theme", () => {
      // INVOKE & EXPECT: Check all themes have required properties
      for (const theme of COLOR_THEMES) {
        expect(theme).toHaveProperty("id");
        expect(theme).toHaveProperty("name");
        expect(theme).toHaveProperty("background");
        expect(theme).toHaveProperty("backgroundCss");
        expect(theme).toHaveProperty("backgroundGradient");
        expect(theme).toHaveProperty("textPrimary");
        expect(theme).toHaveProperty("textSecondary");
        expect(theme).toHaveProperty("textTertiary");
        expect(theme).toHaveProperty("buttonGlow");
        expect(theme).toHaveProperty("successColor");
        expect(theme).toHaveProperty("dangerColor");

        // Validate CSS color format
        expect(theme.backgroundCss).toMatch(/^#[0-9A-F]{6}$/i);
      }
    });

    it("should have exactly 8 themes available", () => {
      expect(COLOR_THEMES).toHaveLength(8);
    });
  });
});

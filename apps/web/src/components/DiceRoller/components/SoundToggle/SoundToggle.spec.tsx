/**
 * @vitest-environment jsdom
 *
 * SoundToggle User Interaction Tests following SIFERS methodology
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { hexToRgb, mockTheme } from "@/test-utils";
import { SoundToggle, SoundToggleProps } from "./SoundToggle";

// ============================================================================
// SETUP FUNCTION
// ============================================================================

interface SetupOptions {
  soundEnabled?: boolean;
  onToggle?: Mock;
}

interface SetupResult {
  container: HTMLElement;
  onToggle: Mock;
  getButton: () => HTMLElement;
  clickButton: () => void;
}

function setup(options: SetupOptions = {}): SetupResult {
  const { soundEnabled = true, onToggle = vi.fn() } = options;

  const props: SoundToggleProps = {
    soundEnabled,
    onToggle,
    theme: mockTheme,
  };

  const { container } = render(<SoundToggle {...props} />);

  const getButton = () => screen.getByRole("button", { name: /mute|unmute/i });
  const clickButton = () => fireEvent.click(getButton());

  return { container, onToggle, getButton, clickButton };
}

// ============================================================================
// TESTS
// ============================================================================

describe("SoundToggle - User Interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("when sound is enabled", () => {
    it("should display mute label", () => {
      // Setup
      setup({ soundEnabled: true });

      // Find
      const button = screen.getByRole("button");

      // Expect
      expect(button.getAttribute("aria-label")).toBe("Mute sound");
      expect(button.getAttribute("title")).toBe("Mute sound");
    });

    it("should show sound-on icon (speaker with waves)", () => {
      // Setup
      const { container } = setup({ soundEnabled: true });

      // Find
      const svg = container.querySelector("svg");
      const wavePaths = container.querySelectorAll('path[d*="15.54"]');

      // Expect
      expect(svg).not.toBeNull();
      expect(wavePaths.length).toBeGreaterThan(0);
    });
  });

  describe("when sound is disabled", () => {
    it("should display unmute label", () => {
      // Setup
      setup({ soundEnabled: false });

      // Find
      const button = screen.getByRole("button");

      // Expect
      expect(button.getAttribute("aria-label")).toBe("Unmute sound");
      expect(button.getAttribute("title")).toBe("Unmute sound");
    });

    it("should show sound-off icon (speaker with X)", () => {
      // Setup
      const { container } = setup({ soundEnabled: false });

      // Find
      const svg = container.querySelector("svg");
      const xLines = container.querySelectorAll('line[x1="23"]');

      // Expect
      expect(svg).not.toBeNull();
      expect(xLines.length).toBeGreaterThan(0);
    });
  });

  describe("when user clicks the toggle", () => {
    it("should call onToggle callback", () => {
      // Setup
      const { onToggle, clickButton } = setup();

      // Invoke
      clickButton();

      // Expect
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("should call onToggle regardless of current state", () => {
      // Setup - sound disabled
      const onToggle = vi.fn();
      const { clickButton } = setup({ soundEnabled: false, onToggle });

      // Invoke
      clickButton();

      // Expect
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe("styling and theme", () => {
    it("should apply theme colors to button", () => {
      // Setup
      const { getButton } = setup();

      // Find
      const button = getButton();

      // Expect - colors are normalized to RGB in the browser
      expect(button.style.color).toBe(hexToRgb(mockTheme.textPrimary));
    });

    it("should have proper button classes for sizing", () => {
      // Setup
      const { getButton } = setup();

      // Find
      const button = getButton();

      // Expect
      expect(button.className).toContain("w-10");
      expect(button.className).toContain("h-10");
      expect(button.className).toContain("rounded-full");
    });
  });
});

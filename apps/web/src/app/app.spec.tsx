/**
 * @vitest-environment jsdom
 *
 * App Integration Tests following SIFERS methodology
 *
 * Note: The full DiceRoller component uses Three.js/WebGL which isn't supported
 * in jsdom. These tests verify that the App shell renders correctly.
 * For Three.js tests, see useThreeScene.spec.ts which tests the logic.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupLocalStorageMock } from "../test-utils";

// Mock the DiceRoller component to avoid WebGL issues
vi.mock("../components/DiceRoller", () => ({
  DiceRoller: () => (
    <div data-testid="mock-dice-roller">
      <h2>GOD-ROLL</h2>
      <button>START GAME</button>
    </div>
  ),
}));

// Import App after mocking
import App from "./app";

// ============================================================================
// SETUP FUNCTION
// ============================================================================

interface SetupResult {
  container: HTMLElement;
}

function setup(): SetupResult {
  const { container } = render(<App />);
  return { container };
}

// ============================================================================
// TESTS
// ============================================================================

describe("App - Integration", () => {
  beforeEach(() => {
    setupLocalStorageMock();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  describe("when app loads", () => {
    it("should render successfully", () => {
      const { container } = setup();

      expect(container).toBeTruthy();
    });

    it("should render the DiceRoller component", () => {
      setup();

      expect(screen.getByTestId("mock-dice-roller")).toBeTruthy();
    });

    it("should render the game title", () => {
      setup();

      expect(screen.getByText(/god-roll/i)).toBeTruthy();
    });

    it("should render start game button", () => {
      setup();

      expect(screen.getByRole("button", { name: /start game/i })).toBeTruthy();
    });
  });
});

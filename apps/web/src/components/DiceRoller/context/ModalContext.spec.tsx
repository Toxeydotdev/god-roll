/**
 * @vitest-environment jsdom
 *
 * ModalContext Tests - Portal-based modal management
 */
import { mockTheme } from "@/test-utils";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ModalProvider } from "./ModalContext";
import { ThemeProvider } from "./ThemeContext";

// Mock the modal components to avoid Three.js/WebGL issues
vi.mock("@/components/DiceRoller/components", () => ({
  Leaderboard: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="mock-leaderboard">
      <button onClick={onClose}>Close Leaderboard</button>
    </div>
  ),
  GameRules: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="mock-rules">
      <button onClick={onClose}>Close Rules</button>
    </div>
  ),
  ColorPicker: ({
    onClose,
    onSelectTheme,
  }: {
    onClose: () => void;
    onSelectTheme: (theme: any) => void;
  }) => (
    <div data-testid="mock-color-picker">
      <button onClick={() => onSelectTheme(mockTheme)}>Select Theme</button>
      <button onClick={onClose}>Close Picker</button>
    </div>
  ),
}));

// ============================================================================
// TEST COMPONENT
// ============================================================================

import { useModal } from "./ModalContext";

function TestComponent() {
  const { openModal } = useModal();

  return (
    <div>
      <button onClick={() => openModal("leaderboard")}>Open Leaderboard</button>
      <button onClick={() => openModal("rules")}>Open Rules</button>
      <button onClick={() => openModal("colorPicker")}>
        Open Color Picker
      </button>
    </div>
  );
}

// ============================================================================
// TESTS
// ============================================================================

describe("ModalContext", () => {
  afterEach(() => {
    cleanup();
  });

  describe("when opening leaderboard modal", () => {
    it("should render leaderboard via portal", () => {
      render(
        <ThemeProvider>
          <ModalProvider>
            <TestComponent />
          </ModalProvider>
        </ThemeProvider>
      );

      fireEvent.click(screen.getByText("Open Leaderboard"));

      expect(screen.getByTestId("mock-leaderboard")).toBeTruthy();
    });

    it("should close leaderboard when close is clicked", () => {
      render(
        <ThemeProvider>
          <ModalProvider>
            <TestComponent />
          </ModalProvider>
        </ThemeProvider>
      );

      fireEvent.click(screen.getByText("Open Leaderboard"));
      expect(screen.getByTestId("mock-leaderboard")).toBeTruthy();

      fireEvent.click(screen.getByText("Close Leaderboard"));
      expect(screen.queryByTestId("mock-leaderboard")).toBeFalsy();
    });
  });

  describe("when opening rules modal", () => {
    it("should render rules via portal", () => {
      render(
        <ThemeProvider>
          <ModalProvider>
            <TestComponent />
          </ModalProvider>
        </ThemeProvider>
      );

      fireEvent.click(screen.getByText("Open Rules"));

      expect(screen.getByTestId("mock-rules")).toBeTruthy();
    });
  });

  describe("when opening color picker modal", () => {
    it("should render color picker via portal", () => {
      render(
        <ThemeProvider>
          <ModalProvider>
            <TestComponent />
          </ModalProvider>
        </ThemeProvider>
      );

      fireEvent.click(screen.getByText("Open Color Picker"));

      expect(screen.getByTestId("mock-color-picker")).toBeTruthy();
    });

    it("should call setTheme and close when theme is selected", () => {
      render(
        <ThemeProvider>
          <ModalProvider>
            <TestComponent />
          </ModalProvider>
        </ThemeProvider>
      );

      fireEvent.click(screen.getByText("Open Color Picker"));
      fireEvent.click(screen.getByText("Select Theme"));

      // Theme is selected and modal closes
      expect(screen.queryByTestId("mock-color-picker")).toBeFalsy();
    });
  });

  describe("when useModal is used outside provider", () => {
    it("should throw an error", () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useModal must be used within a ModalProvider");

      consoleSpy.mockRestore();
    });
  });
});

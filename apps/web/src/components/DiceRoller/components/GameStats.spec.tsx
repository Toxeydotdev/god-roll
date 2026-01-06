/**
 * @vitest-environment jsdom
 *
 * GameStats User Interaction Tests following SIFERS methodology:
 * - Setup: Prepare test environment and dependencies
 * - Invoke: Trigger user actions
 * - Find: Locate affected elements
 * - Expect: Assert expected outcomes
 * - Reset: Clean up after test
 */
import {
  act,
  cleanup,
  fireEvent,
  render,
  RenderResult,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { hexToRgb, mockOceanTheme, mockTheme } from "../../../test-utils";
import { GameStats, GameStatsProps } from "./GameStats";

// ============================================================================
// SETUP FUNCTION - Reusable test setup with configurable scenarios
// ============================================================================

interface SetupOptions {
  totalScore?: number;
  round?: number;
  onReset?: Mock;
  onShowLeaderboard?: Mock;
  onShowRules?: Mock;
  onShowColorPicker?: Mock;
  theme?: typeof mockTheme;
}

interface SetupResult {
  // Rendered elements
  container: RenderResult["container"];
  // Callbacks for assertions
  onReset: Mock;
  onShowLeaderboard: Mock;
  onShowRules: Mock;
  onShowColorPicker: Mock;
  // Helper functions
  getResetButton: () => HTMLElement;
  getLeaderboardButton: () => HTMLElement;
  getRulesButton: () => HTMLElement;
  getThemeButton: () => HTMLElement;
  // Hold-to-reset helpers
  startHold: (type?: "mouse" | "touch") => void;
  releaseHold: (type?: "mouse" | "touch") => void;
  cancelHold: (type?: "mouseLeave" | "touchEnd" | "touchCancel") => void;
  advanceTimer: (ms: number) => Promise<void>;
}

function setup(options: SetupOptions = {}): SetupResult {
  const {
    totalScore = 0,
    round = 1,
    onReset = vi.fn(),
    onShowLeaderboard = vi.fn(),
    onShowRules = vi.fn(),
    onShowColorPicker = vi.fn(),
    theme = mockTheme,
  } = options;

  const props: GameStatsProps = {
    totalScore,
    round,
    onReset,
    onShowLeaderboard,
    onShowRules,
    onShowColorPicker,
    theme,
  };

  const { container } = render(<GameStats {...props} />);

  // Helper to get buttons - reset button may show "RESET" or "HOLD..."
  const getResetButton = () => {
    const resetBtn = screen.queryByRole("button", { name: "RESET" });
    if (resetBtn) return resetBtn;
    return screen.getByRole("button", { name: "HOLD..." });
  };
  // Emoji buttons need to be found by their text content
  const getLeaderboardButton = () => screen.getByRole("button", { name: "🏆" });
  const getRulesButton = () => screen.getByRole("button", { name: "❓" });
  const getThemeButton = () => screen.getByRole("button", { name: "🎨" });

  // Store reference to button before state changes
  let resetButtonRef: HTMLElement | null = null;

  // Hold interaction helpers
  const startHold = (type: "mouse" | "touch" = "mouse") => {
    resetButtonRef = getResetButton();
    if (type === "mouse") {
      fireEvent.mouseDown(resetButtonRef);
    } else {
      fireEvent.touchStart(resetButtonRef);
    }
  };

  const releaseHold = (type: "mouse" | "touch" = "mouse") => {
    const button = resetButtonRef || getResetButton();
    if (type === "mouse") {
      fireEvent.mouseUp(button);
    } else {
      fireEvent.touchEnd(button);
    }
  };

  const cancelHold = (
    type: "mouseLeave" | "touchEnd" | "touchCancel" = "mouseLeave"
  ) => {
    const button = resetButtonRef || getResetButton();
    if (type === "mouseLeave") {
      fireEvent.mouseLeave(button);
    } else if (type === "touchEnd") {
      fireEvent.touchEnd(button);
    } else {
      fireEvent.touchCancel(button);
    }
  };

  const advanceTimer = async (ms: number) => {
    await act(async () => {
      vi.advanceTimersByTime(ms);
    });
  };

  return {
    container,
    onReset,
    onShowLeaderboard,
    onShowRules,
    onShowColorPicker,
    getResetButton,
    getLeaderboardButton,
    getRulesButton,
    getThemeButton,
    startHold,
    releaseHold,
    cancelHold,
    advanceTimer,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe("GameStats - User Interactions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  // --------------------------------------------------------------------------
  // Viewing Game Stats
  // --------------------------------------------------------------------------
  describe("when user views game stats during play", () => {
    it("should display current score prominently", () => {
      setup({ totalScore: 42 });

      expect(screen.getByText("SCORE: 42")).toBeTruthy();
    });

    it("should show current round number", () => {
      setup({ round: 5 });

      expect(screen.getByText("Round 5")).toBeTruthy();
    });

    it("should display all action buttons", () => {
      const {
        getResetButton,
        getLeaderboardButton,
        getRulesButton,
        getThemeButton,
      } = setup();

      expect(getResetButton()).toBeTruthy();
      expect(getLeaderboardButton()).toBeTruthy();
      expect(getRulesButton()).toBeTruthy();
      expect(getThemeButton()).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // Modal Triggers
  // --------------------------------------------------------------------------
  describe("when user clicks action buttons", () => {
    it("should open leaderboard when leaderboard button clicked", () => {
      const { getLeaderboardButton, onShowLeaderboard } = setup();

      fireEvent.click(getLeaderboardButton());

      expect(onShowLeaderboard).toHaveBeenCalledTimes(1);
    });

    it("should open rules when rules button clicked", () => {
      const { getRulesButton, onShowRules } = setup();

      fireEvent.click(getRulesButton());

      expect(onShowRules).toHaveBeenCalledTimes(1);
    });

    it("should open color picker when theme button clicked", () => {
      const { getThemeButton, onShowColorPicker } = setup();

      fireEvent.click(getThemeButton());

      expect(onShowColorPicker).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // Theme Styling
  // --------------------------------------------------------------------------
  describe("theme styling", () => {
    it("should apply Forest theme colors", () => {
      setup({ theme: mockTheme });

      const scoreElement = screen.getByText(/SCORE:/);
      expect(scoreElement.style.color).toBe(hexToRgb(mockTheme.textPrimary));
    });

    it("should apply Ocean theme colors", () => {
      setup({ theme: mockOceanTheme });

      const scoreElement = screen.getByText(/SCORE:/);
      expect(scoreElement.style.color).toBe(
        hexToRgb(mockOceanTheme.textPrimary)
      );
    });
  });

  // --------------------------------------------------------------------------
  // Hold-to-Reset (Mouse)
  // --------------------------------------------------------------------------
  describe("when user holds reset button with mouse", () => {
    it("should show HOLD... feedback while holding", async () => {
      const { startHold, releaseHold, advanceTimer } = setup();

      startHold("mouse");
      await advanceTimer(100);

      expect(screen.getByText("HOLD...")).toBeTruthy();

      releaseHold("mouse");
    });

    it("should trigger reset after holding for 1 second", async () => {
      const { startHold, advanceTimer, onReset } = setup();

      startHold("mouse");
      await advanceTimer(1100);

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it("should NOT reset if released before 1 second", async () => {
      const { startHold, releaseHold, advanceTimer, onReset } = setup();

      startHold("mouse");
      await advanceTimer(500);
      releaseHold("mouse");
      await advanceTimer(1000); // Wait to ensure no delayed trigger

      expect(onReset).not.toHaveBeenCalled();
    });

    it("should cancel if mouse leaves button", async () => {
      const { startHold, cancelHold, advanceTimer, onReset } = setup();

      startHold("mouse");
      await advanceTimer(500);
      cancelHold("mouseLeave");
      await advanceTimer(1000);

      expect(onReset).not.toHaveBeenCalled();
      expect(screen.getByText("RESET")).toBeTruthy();
    });

    it("should show progress indicator while holding", async () => {
      const { startHold, releaseHold, advanceTimer, getResetButton } = setup();

      startHold("mouse");
      await advanceTimer(500);

      const progressSpan = getResetButton().querySelector("span.absolute");
      expect(progressSpan).toBeTruthy();

      releaseHold("mouse");
    });

    it("should reset progress after release", async () => {
      const { startHold, releaseHold, advanceTimer, getResetButton } = setup();

      startHold("mouse");
      await advanceTimer(500);
      releaseHold("mouse");
      await advanceTimer(50);

      const progressSpan = getResetButton().querySelector(
        "span.absolute"
      ) as HTMLElement;
      expect(progressSpan?.style.width).toBe("0%");
    });
  });

  // --------------------------------------------------------------------------
  // Hold-to-Reset (Touch/Mobile)
  // --------------------------------------------------------------------------
  describe("when user holds reset button on mobile (touch)", () => {
    it("should trigger reset after touch hold for 1 second", async () => {
      const { startHold, advanceTimer, onReset } = setup();

      startHold("touch");
      await advanceTimer(1100);

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it("should NOT reset if finger lifted early (touchEnd)", async () => {
      const { startHold, cancelHold, advanceTimer, onReset } = setup();

      startHold("touch");
      await advanceTimer(500);
      cancelHold("touchEnd");
      await advanceTimer(1000);

      expect(onReset).not.toHaveBeenCalled();
    });

    it("should cancel on touch cancel event", async () => {
      const { startHold, cancelHold, advanceTimer, onReset } = setup();

      startHold("touch");
      await advanceTimer(500);
      cancelHold("touchCancel");
      await advanceTimer(1000);

      expect(onReset).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------
  describe("edge cases", () => {
    it("should handle score of 0", () => {
      setup({ totalScore: 0 });

      expect(screen.getByText("SCORE: 0")).toBeTruthy();
    });

    it("should handle high scores", () => {
      setup({ totalScore: 99999 });

      expect(screen.getByText("SCORE: 99999")).toBeTruthy();
    });

    it("should handle round 1", () => {
      setup({ round: 1 });

      expect(screen.getByText("Round 1")).toBeTruthy();
    });

    it("should handle high round numbers", () => {
      setup({ round: 100 });

      expect(screen.getByText("Round 100")).toBeTruthy();
    });
  });
});

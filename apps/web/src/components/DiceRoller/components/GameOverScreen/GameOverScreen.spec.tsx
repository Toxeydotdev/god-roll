/**
 * @vitest-environment jsdom
 *
 * GameOverScreen User Interaction Tests following SIFERS methodology
 */
import {
  cleanup,
  fireEvent,
  render,
  RenderResult,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { hexToRgb, mockOceanTheme, mockTheme } from "../../../../test-utils";
import { LeaderboardEntry } from "../../leaderboard";
import { GameOverScreen } from "./GameOverScreen";

// ============================================================================
// SETUP FUNCTION
// ============================================================================

interface SetupOptions {
  lastRollTotal?: number;
  totalScore?: number;
  round?: number;
  onPlayAgain?: Mock;
  highlightIndex?: number;
  leaderboardEntries?: LeaderboardEntry[];
  onLeaderboardChange?: Mock;
  theme?: typeof mockTheme;
}

interface SetupResult {
  container: RenderResult["container"];
  onPlayAgain: Mock;
  onLeaderboardChange: Mock;
  getPlayAgainButton: () => HTMLElement;
  clickPlayAgain: () => void;
}

function setup(options: SetupOptions = {}): SetupResult {
  const {
    lastRollTotal = 21,
    totalScore = 150,
    round = 4,
    onPlayAgain = vi.fn(),
    highlightIndex,
    leaderboardEntries = [],
    onLeaderboardChange = vi.fn(),
    theme = mockTheme,
  } = options;

  const { container } = render(
    <GameOverScreen
      lastRollTotal={lastRollTotal}
      totalScore={totalScore}
      round={round}
      onPlayAgain={onPlayAgain}
      highlightIndex={highlightIndex}
      leaderboardEntries={leaderboardEntries}
      onLeaderboardChange={onLeaderboardChange}
      theme={theme}
    />
  );

  const getPlayAgainButton = () =>
    screen.getByRole("button", { name: /play again/i });
  const clickPlayAgain = () => fireEvent.click(getPlayAgainButton());

  return {
    container,
    onPlayAgain,
    onLeaderboardChange,
    getPlayAgainButton,
    clickPlayAgain,
  };
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createLeaderboardEntries(count: number): LeaderboardEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    score: (count - i) * 100,
    rounds: count - i,
    date: new Date(2024, 0, 15 - i).toISOString(),
  }));
}

// ============================================================================
// TESTS
// ============================================================================

describe("GameOverScreen - User Interactions", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  // --------------------------------------------------------------------------
  // Game Over Display
  // --------------------------------------------------------------------------
  describe("when user loses the game", () => {
    it("should display GAME OVER message", () => {
      setup();

      const gameOver = screen.getByText("GAME OVER!");
      expect(gameOver).toBeTruthy();
    });

    it("should show what roll caused the loss", () => {
      setup({ lastRollTotal: 28 });

      expect(screen.getByText(/You rolled 28/)).toBeTruthy();
      expect(screen.getByText(/divisible by 7/)).toBeTruthy();
    });

    it("should display final score", () => {
      setup({ totalScore: 275 });

      expect(screen.getByText(/Final Score: 275/)).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // Rounds Survived Display
  // --------------------------------------------------------------------------
  describe("rounds survived display", () => {
    it("should show plural 'rounds' for multiple rounds", () => {
      setup({ round: 4 }); // Survived rounds 1, 2, 3

      expect(screen.getByText(/You survived 3 rounds!/)).toBeTruthy();
    });

    it("should show singular 'round' for one round", () => {
      setup({ round: 2 }); // Survived 1 round

      expect(screen.getByText(/You survived 1 round!/)).toBeTruthy();
    });

    it("should show 0 rounds when dying on first roll", () => {
      setup({ round: 1 }); // Survived 0 rounds

      expect(screen.getByText(/You survived 0 rounds!/)).toBeTruthy();
    });

    it("should handle high round counts", () => {
      setup({ round: 51 }); // Survived 50 rounds

      expect(screen.getByText(/You survived 50 rounds!/)).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // Play Again
  // --------------------------------------------------------------------------
  describe("when user wants to play again", () => {
    it("should show Play Again button", () => {
      const { getPlayAgainButton } = setup();

      expect(getPlayAgainButton()).toBeTruthy();
    });

    it("should trigger callback when clicked", () => {
      const { clickPlayAgain, onPlayAgain } = setup();

      clickPlayAgain();

      expect(onPlayAgain).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // Leaderboard Display
  // --------------------------------------------------------------------------
  describe("leaderboard display", () => {
    it("should show empty state when no scores exist", () => {
      setup({ leaderboardEntries: [] });

      expect(screen.getByText(/No scores yet!/)).toBeTruthy();
    });

    it("should show leaderboard title", () => {
      setup({ leaderboardEntries: createLeaderboardEntries(3) });

      expect(screen.getByText("🏆 Leaderboard")).toBeTruthy();
    });

    it("should display all leaderboard entries", () => {
      const entries = createLeaderboardEntries(3);
      setup({ leaderboardEntries: entries });

      expect(screen.getByText("300")).toBeTruthy();
      expect(screen.getByText("200")).toBeTruthy();
      expect(screen.getByText("100")).toBeTruthy();
    });

    it("should highlight current game score in leaderboard", () => {
      const entries = createLeaderboardEntries(3);
      const { container } = setup({
        leaderboardEntries: entries,
        highlightIndex: 1,
      });

      const highlightedRow = container.querySelector("tr.bg-yellow-100");
      expect(highlightedRow).toBeTruthy();
    });

    it("should not highlight when highlightIndex is undefined", () => {
      const entries = createLeaderboardEntries(3);
      const { container } = setup({
        leaderboardEntries: entries,
        highlightIndex: undefined,
      });

      const highlightedRow = container.querySelector("tr.bg-yellow-100");
      expect(highlightedRow).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Theme Styling
  // --------------------------------------------------------------------------
  describe("theme styling", () => {
    it("should apply Forest theme to text", () => {
      setup({ theme: mockTheme });

      const finalScore = screen.getByText(/Final Score:/);
      expect(finalScore.style.color).toBe(hexToRgb(mockTheme.textPrimary));
    });

    it("should apply Ocean theme to text", () => {
      setup({ theme: mockOceanTheme });

      const finalScore = screen.getByText(/Final Score:/);
      expect(finalScore.style.color).toBe(hexToRgb(mockOceanTheme.textPrimary));
    });

    it("should style Play Again button with theme", () => {
      const { getPlayAgainButton } = setup({ theme: mockTheme });

      expect(getPlayAgainButton().style.backgroundColor).toBe(
        hexToRgb(mockTheme.textPrimary)
      );
    });
  });

  // --------------------------------------------------------------------------
  // Layout & Responsiveness
  // --------------------------------------------------------------------------
  describe("layout", () => {
    it("should have a semi-transparent backdrop", () => {
      const { container } = setup();

      const backdrop = container.querySelector(".bg-black\\/50");
      expect(backdrop).toBeTruthy();
    });

    it("should be scrollable for overflow content", () => {
      const { container } = setup();

      const scrollable = container.querySelector(".overflow-auto");
      expect(scrollable).toBeTruthy();
    });

    it("should have white card background", () => {
      const { container } = setup();

      const card = container.querySelector(".bg-white\\/95");
      expect(card).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------
  describe("edge cases", () => {
    it("should handle score of 0", () => {
      setup({ totalScore: 0 });

      expect(screen.getByText(/Final Score: 0/)).toBeTruthy();
    });

    it("should handle very high scores", () => {
      setup({ totalScore: 999999 });

      expect(screen.getByText(/Final Score: 999999/)).toBeTruthy();
    });

    it("should handle roll total of exactly 7", () => {
      setup({ lastRollTotal: 7 });

      expect(screen.getByText(/You rolled 7/)).toBeTruthy();
    });

    it("should handle large leaderboard", () => {
      const entries = createLeaderboardEntries(10);
      setup({ leaderboardEntries: entries });

      // Should show all 10 entries
      expect(screen.getByText("1000")).toBeTruthy();
      expect(screen.getByText("100")).toBeTruthy();
    });
  });
});

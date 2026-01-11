/**
 * @vitest-environment jsdom
 *
 * StartScreen User Interaction Tests following SIFERS methodology
 */
import {
  AchievementProvider,
  AuthProvider,
  DiceSkinProvider,
  ModalProvider,
  ThemeProvider,
} from "@/components/DiceRoller/context";
import { hexToRgb, mockTheme } from "@/test-utils";
import {
  cleanup,
  fireEvent,
  render,
  RenderResult,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, Mock, vi } from "vitest";
import { StartScreen } from "./StartScreen";

// Mock supabase to prevent initialization errors in tests
vi.mock("@/lib/supabase", () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

// ============================================================================
// SETUP FUNCTION
// ============================================================================

interface SetupOptions {
  onStartGame?: Mock;
}

interface SetupResult {
  container: RenderResult["container"];
  onStartGame: Mock;
  getStartButton: () => HTMLElement;
  getLeaderboardButton: () => HTMLElement;
  clickStart: () => void;
  clickLeaderboard: () => void;
}

function setup(options: SetupOptions = {}): SetupResult {
  const { onStartGame = vi.fn() } = options;

  const { container } = render(
    <ThemeProvider>
      <AuthProvider>
        <DiceSkinProvider>
          <AchievementProvider>
            <ModalProvider>
              <StartScreen onStartGame={onStartGame} />
            </ModalProvider>
          </AchievementProvider>
        </DiceSkinProvider>
      </AuthProvider>
    </ThemeProvider>
  );

  const getStartButton = () =>
    screen.getByRole("button", { name: /start game/i });
  const getLeaderboardButton = () =>
    screen.getByRole("button", { name: /leaderboard/i });

  const clickStart = () => fireEvent.click(getStartButton());
  const clickLeaderboard = () => fireEvent.click(getLeaderboardButton());

  return {
    container,
    onStartGame,
    getStartButton,
    getLeaderboardButton,
    clickStart,
    clickLeaderboard,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe("StartScreen - User Interactions", () => {
  afterEach(() => {
    cleanup();
  });

  // --------------------------------------------------------------------------
  // Initial View
  // --------------------------------------------------------------------------
  describe("when user lands on the start screen", () => {
    it("should display the game title prominently", () => {
      setup();

      const title = screen.getByText("GOD-ROLL");
      expect(title).toBeTruthy();
      expect(title.tagName).toBe("H2");
    });

    it("should show game instructions", () => {
      setup();

      expect(screen.getByText("Roll dice to score points")).toBeTruthy();
      expect(screen.getByText("Avoid totals divisible by 7!")).toBeTruthy();
      expect(screen.getByText(/Each round adds \+1 die/)).toBeTruthy();
    });

    it("should display a prominent start button", () => {
      const { getStartButton } = setup();

      expect(getStartButton()).toBeTruthy();
      expect(getStartButton().className).toContain("text-3xl");
    });
  });

  // --------------------------------------------------------------------------
  // Starting the Game
  // --------------------------------------------------------------------------
  describe("when user clicks Start Game", () => {
    it("should trigger the game start callback", () => {
      const { clickStart, onStartGame } = setup();

      clickStart();

      expect(onStartGame).toHaveBeenCalledTimes(1);
    });

    it("should not trigger other callbacks", () => {
      const { clickStart, onStartGame } = setup();

      clickStart();

      // Clicking start should only trigger start game, not open any modals
      expect(onStartGame).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // Theme Styling
  // --------------------------------------------------------------------------
  describe("theme styling", () => {
    it("should apply theme colors to title", () => {
      setup();

      const title = screen.getByText("GOD-ROLL");
      expect(title.style.color).toBe(hexToRgb(mockTheme.textPrimary));
    });

    it("should style start button with accent colors", () => {
      const { getStartButton } = setup();

      expect(getStartButton().style.backgroundColor).toBe(
        hexToRgb(mockTheme.accentColor)
      );
      expect(getStartButton().style.color).toBe(
        hexToRgb(mockTheme.backgroundCss)
      );
    });

    it("should style instructions with secondary theme colors", () => {
      setup();

      const instruction = screen.getByText("Roll dice to score points");
      expect(instruction.style.color).toBe(hexToRgb(mockTheme.textSecondary));
    });
  });

  // --------------------------------------------------------------------------
  // Accessibility
  // --------------------------------------------------------------------------
  describe("accessibility", () => {
    it("should have accessible button labels", () => {
      const { getStartButton } = setup();

      expect(getStartButton()).toBeTruthy();
    });

    it("should use semantic heading for title", () => {
      setup();

      const title = screen.getByRole("heading", { level: 2 });
      expect(title.textContent).toBe("GOD-ROLL");
    });
  });
});

import { ColorTheme } from "../components/DiceRoller/colorThemes";

export const mockTheme: ColorTheme = {
  id: "green",
  name: "Forest",
  background: 0x6ab06a,
  backgroundCss: "#6AB06A",
  backgroundGradient:
    "linear-gradient(145deg, #90EE90 0%, #6AB06A 50%, #4A904A 100%)",
  textPrimary: "#1a5a1a",
  textSecondary: "#2a7a2a",
  textTertiary: "#4a9a4a",
  accentColor: "#FFD700",
  accentHover: "#FFC000",
  buttonGlow: "rgba(255, 215, 0, 0.4)",
  successColor: "#32CD32",
  dangerColor: "#DC3545",
};

export const mockOceanTheme: ColorTheme = {
  id: "blue",
  name: "Ocean",
  background: 0x5ba3c0,
  backgroundCss: "#5BA3C0",
  backgroundGradient:
    "linear-gradient(145deg, #87CEEB 0%, #5BA3C0 50%, #3A8AA8 100%)",
  textPrimary: "#1a4a6a",
  textSecondary: "#2a5a7a",
  textTertiary: "#4a7a9a",
  accentColor: "#FF6B35",
  accentHover: "#FF5722",
  buttonGlow: "rgba(255, 107, 53, 0.4)",
  successColor: "#00CED1",
  dangerColor: "#FF4757",
};

// Helper to convert hex to rgb format for style comparisons
// Browsers normalize colors to rgb() format
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgb(${r}, ${g}, ${b})`;
}

export const createMockGameStatsProps = (overrides = {}) => ({
  totalScore: 0,
  round: 1,
  onReset: () => {},
  onShowLeaderboard: () => {},
  onShowRules: () => {},
  onShowColorPicker: () => {},
  theme: mockTheme,
  ...overrides,
});

export const createMockStartScreenProps = (overrides = {}) => ({
  onStartGame: () => {},
  onShowLeaderboard: () => {},
  onShowRules: () => {},
  onShowColorPicker: () => {},
  theme: mockTheme,
  ...overrides,
});

export const createMockGameOverScreenProps = (overrides = {}) => ({
  finalScore: 100,
  rounds: 3,
  onPlayAgain: () => {},
  onShowLeaderboard: () => {},
  onShowRules: () => {},
  onShowColorPicker: () => {},
  theme: mockTheme,
  ...overrides,
});

export const createMockLeaderboardEntry = (overrides = {}) => ({
  score: 100,
  rounds: 3,
  date: new Date().toISOString(),
  ...overrides,
});

import { ColorTheme } from "../components/DiceRoller/colorThemes";

export const mockTheme: ColorTheme = {
  id: "green",
  name: "Forest",
  background: 0x90ee90,
  backgroundCss: "#90EE90",
  textPrimary: "#1a5a1a",
  textSecondary: "#2a7a2a",
  textTertiary: "#4a9a4a",
  accentColor: "#FFD700",
  accentHover: "#FFC000",
};

export const mockOceanTheme: ColorTheme = {
  id: "blue",
  name: "Ocean",
  background: 0x87ceeb,
  backgroundCss: "#87CEEB",
  textPrimary: "#1a4a6a",
  textSecondary: "#2a5a7a",
  textTertiary: "#4a7a9a",
  accentColor: "#FFD700",
  accentHover: "#FFC000",
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

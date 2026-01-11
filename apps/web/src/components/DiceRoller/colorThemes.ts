// Color theme definitions and utilities

export interface ColorTheme {
  id: string;
  name: string;
  background: number;
  backgroundCss: string;
  backgroundGradient: string; // CSS gradient for rich backgrounds
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accentColor: string;
  accentHover: string;
  buttonGlow: string; // Glow color for the roll button
  successColor: string; // Color for successful rolls
  dangerColor: string; // Color for failed rolls (divisible by 7)
}

export const COLOR_THEMES: ColorTheme[] = [
  {
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
  },
  {
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
  },
  {
    id: "purple",
    name: "Lavender",
    background: 0xb080b0,
    backgroundCss: "#B080B0",
    backgroundGradient:
      "linear-gradient(145deg, #DDA0DD 0%, #B080B0 50%, #8A608A 100%)",
    textPrimary: "#4a2a5a",
    textSecondary: "#5a3a6a",
    textTertiary: "#7a5a8a",
    accentColor: "#00CED1",
    accentHover: "#00B4B4",
    buttonGlow: "rgba(0, 206, 209, 0.4)",
    successColor: "#9370DB",
    dangerColor: "#FF6B6B",
  },
  {
    id: "orange",
    name: "Sunset",
    background: 0xd4a880,
    backgroundCss: "#D4A880",
    backgroundGradient:
      "linear-gradient(145deg, #FFDAB9 0%, #D4A880 50%, #C08050 100%)",
    textPrimary: "#6a3a1a",
    textSecondary: "#8a4a2a",
    textTertiary: "#aa6a4a",
    accentColor: "#E91E63",
    accentHover: "#C2185B",
    buttonGlow: "rgba(233, 30, 99, 0.4)",
    successColor: "#FF9800",
    dangerColor: "#E53935",
  },
  {
    id: "pink",
    name: "Sakura",
    background: 0xd48a95,
    backgroundCss: "#D48A95",
    backgroundGradient:
      "linear-gradient(145deg, #FFB6C1 0%, #D48A95 50%, #B06070 100%)",
    textPrimary: "#6a2a3a",
    textSecondary: "#8a3a4a",
    textTertiary: "#aa5a6a",
    accentColor: "#4CAF50",
    accentHover: "#388E3C",
    buttonGlow: "rgba(76, 175, 80, 0.4)",
    successColor: "#FF69B4",
    dangerColor: "#DC143C",
  },
  {
    id: "gray",
    name: "Slate",
    background: 0xa0a0a0,
    backgroundCss: "#A0A0A0",
    backgroundGradient:
      "linear-gradient(145deg, #D3D3D3 0%, #A0A0A0 50%, #707070 100%)",
    textPrimary: "#2a2a2a",
    textSecondary: "#4a4a4a",
    textTertiary: "#6a6a6a",
    accentColor: "#FF5722",
    accentHover: "#E64A19",
    buttonGlow: "rgba(255, 87, 34, 0.4)",
    successColor: "#78909C",
    dangerColor: "#F44336",
  },
  {
    id: "mythic",
    name: "Mythic",
    background: 0x2a1a3a,
    backgroundCss: "#2A1A3A",
    backgroundGradient:
      "linear-gradient(145deg, #3D2A5A 0%, #2A1A3A 50%, #1A0A2A 100%)",
    textPrimary: "#FFD700",
    textSecondary: "#DAA520",
    textTertiary: "#B8860B",
    accentColor: "#9B59B6",
    accentHover: "#8E44AD",
    buttonGlow: "rgba(155, 89, 182, 0.6)",
    successColor: "#FFD700",
    dangerColor: "#E74C3C",
  },
  {
    id: "cyan",
    name: "Electric Cyan",
    background: 0x1a3a4a,
    backgroundCss: "#1A3A4A",
    backgroundGradient:
      "linear-gradient(145deg, #2A5A6A 0%, #1A3A4A 50%, #0A2A3A 100%)",
    textPrimary: "#00FFFF",
    textSecondary: "#00CCCC",
    textTertiary: "#009999",
    accentColor: "#FF00FF",
    accentHover: "#CC00CC",
    buttonGlow: "rgba(255, 0, 255, 0.5)",
    successColor: "#00FF00",
    dangerColor: "#FF4444",
  },
];

const STORAGE_KEY = "godroll_theme_v1";
const DEFAULT_THEME_ID = "green";

export function getSavedThemeId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export function saveThemeId(themeId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // Ignore localStorage errors
  }
}

export function getThemeById(themeId: string): ColorTheme {
  return COLOR_THEMES.find((t) => t.id === themeId) || COLOR_THEMES[0];
}

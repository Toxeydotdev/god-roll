// Color theme definitions and utilities

export interface ColorTheme {
  id: string;
  name: string;
  background: number;
  backgroundCss: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: "green",
    name: "Forest",
    background: 0x90ee90,
    backgroundCss: "#90EE90",
    textPrimary: "#1a5a1a",
    textSecondary: "#2a7a2a",
    textTertiary: "#4a9a4a",
  },
  {
    id: "blue",
    name: "Ocean",
    background: 0x87ceeb,
    backgroundCss: "#87CEEB",
    textPrimary: "#1a4a6a",
    textSecondary: "#2a5a7a",
    textTertiary: "#4a7a9a",
  },
  {
    id: "purple",
    name: "Lavender",
    background: 0xdda0dd,
    backgroundCss: "#DDA0DD",
    textPrimary: "#4a2a5a",
    textSecondary: "#5a3a6a",
    textTertiary: "#7a5a8a",
  },
  {
    id: "orange",
    name: "Sunset",
    background: 0xffdab9,
    backgroundCss: "#FFDAB9",
    textPrimary: "#6a3a1a",
    textSecondary: "#8a4a2a",
    textTertiary: "#aa6a4a",
  },
  {
    id: "pink",
    name: "Sakura",
    background: 0xffb6c1,
    backgroundCss: "#FFB6C1",
    textPrimary: "#6a2a3a",
    textSecondary: "#8a3a4a",
    textTertiary: "#aa5a6a",
  },
  {
    id: "gray",
    name: "Slate",
    background: 0xd3d3d3,
    backgroundCss: "#D3D3D3",
    textPrimary: "#2a2a2a",
    textSecondary: "#4a4a4a",
    textTertiary: "#6a6a6a",
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

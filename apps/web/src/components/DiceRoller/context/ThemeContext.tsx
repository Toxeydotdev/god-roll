/**
 * ThemeContext - Centralized theme management
 *
 * Provides theme state and change handler throughout the app without prop drilling.
 */

import {
  ColorTheme,
  getSavedThemeId,
  getThemeById,
  saveThemeId,
} from "@/components/DiceRoller/colorThemes";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

// ============================================================================
// TYPES
// ============================================================================

interface ThemeContextValue {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({
  children,
}: ThemeProviderProps): React.ReactElement {
  const [theme, setThemeState] = useState<ColorTheme>(() =>
    getThemeById(getSavedThemeId())
  );

  const setTheme = useCallback((newTheme: ColorTheme) => {
    setThemeState(newTheme);
    saveThemeId(newTheme.id);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

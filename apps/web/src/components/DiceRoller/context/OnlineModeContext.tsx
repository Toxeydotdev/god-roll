import React, { createContext, useCallback, useContext, useState } from "react";

const STORAGE_KEY = "godroll_online_mode_v1";
const PLAYER_NAME_KEY = "godroll_player_name_v1";

interface OnlineModeContextValue {
  isOnlineMode: boolean;
  setOnlineMode: (enabled: boolean) => void;
  playerName: string;
  setPlayerName: (name: string) => void;
}

const OnlineModeContext = createContext<OnlineModeContextValue | null>(null);

function getSavedOnlineMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function saveOnlineMode(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // Ignore errors (e.g., private browsing mode)
  }
}

function getSavedPlayerName(): string {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) || "";
  } catch {
    return "";
  }
}

function savePlayerName(name: string): void {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name);
  } catch {
    // Ignore errors
  }
}

interface OnlineModeProviderProps {
  children: React.ReactNode;
}

export function OnlineModeProvider({
  children,
}: OnlineModeProviderProps): React.ReactElement {
  const [isOnlineMode, setIsOnlineMode] = useState(getSavedOnlineMode);
  const [playerName, setPlayerNameState] = useState(getSavedPlayerName);

  const setOnlineMode = useCallback((enabled: boolean) => {
    setIsOnlineMode(enabled);
    saveOnlineMode(enabled);
  }, []);

  const setPlayerName = useCallback((name: string) => {
    setPlayerNameState(name);
    savePlayerName(name);
  }, []);

  return (
    <OnlineModeContext.Provider
      value={{ isOnlineMode, setOnlineMode, playerName, setPlayerName }}
    >
      {children}
    </OnlineModeContext.Provider>
  );
}

export function useOnlineMode(): OnlineModeContextValue {
  const context = useContext(OnlineModeContext);
  if (!context) {
    throw new Error("useOnlineMode must be used within an OnlineModeProvider");
  }
  return context;
}

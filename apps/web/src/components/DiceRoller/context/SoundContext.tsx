/**
 * SoundContext - Centralized sound management
 *
 * Provides sound state and controls throughout the app without prop drilling.
 */

import { useSound as useSoundState } from "@/components/DiceRoller/hooks";
import React, { createContext, ReactNode, useContext } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface SoundContextValue {
  soundEnabled: boolean;
  toggleSound: () => void;
  playDiceHit: (velocity: number) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface SoundProviderProps {
  children: ReactNode;
}

export function SoundProvider({
  children,
}: SoundProviderProps): React.ReactElement {
  const soundState = useSoundState();

  return (
    <SoundContext.Provider value={soundState}>{children}</SoundContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useSound(): SoundContextValue {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}

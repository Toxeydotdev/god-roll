/**
 * DiceSkinContext - Centralized dice skin management
 *
 * Provides dice skin state throughout the app without prop drilling.
 */

import {
  DiceSkin,
  getDiceSkin,
  getSavedSkinId,
  saveSkinId,
} from "@/components/DiceRoller/diceSkins";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

// ============================================================================
// TYPES
// ============================================================================

interface DiceSkinContextValue {
  currentSkin: DiceSkin;
  skinId: string;
  setSkinId: (skinId: string) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const DiceSkinContext = createContext<DiceSkinContextValue | undefined>(
  undefined
);

// ============================================================================
// PROVIDER
// ============================================================================

interface DiceSkinProviderProps {
  children: ReactNode;
}

export function DiceSkinProvider({
  children,
}: DiceSkinProviderProps): React.ReactElement {
  const [skinId, setSkinIdState] = useState<string>(() => getSavedSkinId());
  const currentSkin = useMemo(() => getDiceSkin(skinId), [skinId]);

  const setSkinId = useCallback((newSkinId: string) => {
    setSkinIdState(newSkinId);
    saveSkinId(newSkinId);
  }, []);

  return (
    <DiceSkinContext.Provider value={{ currentSkin, skinId, setSkinId }}>
      {children}
    </DiceSkinContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useDiceSkin(): DiceSkinContextValue {
  const context = useContext(DiceSkinContext);
  if (!context) {
    throw new Error("useDiceSkin must be used within a DiceSkinProvider");
  }
  return context;
}

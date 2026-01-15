/**
 * SoundContext - Centralized sound management
 *
 * Provides sound state and controls throughout the app without prop drilling.
 */

import { useAppLifecycle } from "@/components/DiceRoller/hooks";
import { useSound as useSoundState } from "@/components/DiceRoller/hooks";
import { musicManager } from "@/components/DiceRoller/utils/musicManager";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ============================================================================
// TYPES
// ============================================================================

interface SoundContextValue {
  soundEnabled: boolean;
  toggleSound: () => void;
  playDiceHit: (velocity: number) => void;
  soundVolume: number;
  setSoundVolume: (volume: number) => void;
  musicEnabled: boolean;
  toggleMusic: () => void;
  musicVolume: number;
  setMusicVolume: (volume: number) => void;
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
  const [musicEnabled, setMusicEnabled] = useState(() =>
    musicManager.isEnabled()
  );
  const [musicVolume, setMusicVolumeState] = useState(() =>
    musicManager.getVolume()
  );
  const isTogglingMusic = useRef(false);

  // Set up iOS/Android app lifecycle listener for audio context resumption
  useAppLifecycle();

  // Try to auto-start music on first user interaction if it was enabled
  useEffect(() => {
    const handleInteraction = () => {
      musicManager.tryAutoStart();
      // Sync state after potential auto-start
      setMusicEnabled(musicManager.isEnabled());
    };

    window.addEventListener("click", handleInteraction, { once: true });
    window.addEventListener("touchstart", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  const toggleMusic = useCallback(async () => {
    // Prevent rapid toggling
    if (isTogglingMusic.current) return;

    isTogglingMusic.current = true;

    try {
      const newState = await musicManager.toggle();
      setMusicEnabled(newState);
    } finally {
      // Debounce - prevent another toggle for 100ms
      setTimeout(() => {
        isTogglingMusic.current = false;
      }, 100);
    }
  }, []);

  const handleSetMusicVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setMusicVolumeState(clamped);
    musicManager.setVolume(clamped);
  }, []);

  return (
    <SoundContext.Provider
      value={{
        ...soundState,
        soundVolume: soundState.volume,
        setSoundVolume: soundState.setVolume,
        musicEnabled,
        toggleMusic,
        musicVolume,
        setMusicVolume: handleSetMusicVolume,
      }}
    >
      {children}
    </SoundContext.Provider>
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

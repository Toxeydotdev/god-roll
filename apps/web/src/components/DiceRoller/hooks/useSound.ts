import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSoundEnabled,
  getSoundProfile,
  getSoundVolume,
  setSoundEnabled,
  setSoundProfile,
  setSoundVolume,
  soundManager,
  SoundProfile,
} from "../utils/soundManager";

interface UseSoundReturn {
  /** Whether sound is enabled */
  soundEnabled: boolean;
  /** Toggle sound on/off */
  toggleSound: () => void;
  /** Set sound enabled state */
  setSoundEnabled: (enabled: boolean) => void;
  /** Current volume (0-1) */
  volume: number;
  /** Set volume (0-1) */
  setVolume: (volume: number) => void;
  /** Current sound profile */
  soundProfile: SoundProfile;
  /** Set sound profile */
  setSoundProfile: (profile: SoundProfile) => void;
  /** Play dice hitting floor/table */
  playDiceHit: (velocity?: number) => void;
  /** Play dice hitting wall */
  playWallHit: (velocity?: number) => void;
  /** Play dice rolling sound */
  playDiceRoll: () => void;
  /** Play game over sound */
  playGameOver: () => void;
  /** Play success sound */
  playWin: () => void;
  /** Play impact sound based on velocity and surface type */
  playImpact: (velocity: number, type?: "floor" | "wall") => void;
}

/**
 * Hook for managing game sounds
 *
 * Initializes the audio context on first user interaction and provides
 * methods to play various game sounds.
 */
export function useSound(): UseSoundReturn {
  const [soundEnabled, setSoundEnabledState] = useState(getSoundEnabled);
  const [volume, setVolumeState] = useState(getSoundVolume);
  const [soundProfile, setSoundProfileState] = useState(getSoundProfile);
  const initialized = useRef(false);

  // Initialize sound manager on mount
  useEffect(() => {
    if (!initialized.current) {
      soundManager.init();
      soundManager.setEnabled(soundEnabled);
      soundManager.setVolume(volume);
      soundManager.setSoundProfile(soundProfile);
      initialized.current = true;
    }
  }, [soundEnabled, volume, soundProfile]);

  // Resume audio context on user interaction
  useEffect(() => {
    const handleInteraction = () => {
      soundManager.resume();
    };

    // Listen for first user interaction to unlock audio
    window.addEventListener("click", handleInteraction, { once: true });
    window.addEventListener("touchstart", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  const toggleSound = useCallback(() => {
    const newValue = !soundEnabled;
    setSoundEnabledState(newValue);
    setSoundEnabled(newValue);
  }, [soundEnabled]);

  const handleSetSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    setSoundEnabled(enabled);
  }, []);

  const handleSetVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clamped);
    setSoundVolume(clamped);
  }, []);

  const handleSetSoundProfile = useCallback((profile: SoundProfile) => {
    setSoundProfileState(profile);
    setSoundProfile(profile);
  }, []);

  const playDiceHit = useCallback((velocity?: number) => {
    if (velocity !== undefined) {
      const normalizedVelocity = Math.min(Math.abs(velocity) / 10, 1);
      soundManager.playDiceHit({
        volume: 0.3 + normalizedVelocity * 0.5,
        pitch: 0.8 + normalizedVelocity * 0.4,
      });
    } else {
      soundManager.playDiceHit();
    }
  }, []);

  const playWallHit = useCallback((velocity?: number) => {
    if (velocity !== undefined) {
      const normalizedVelocity = Math.min(Math.abs(velocity) / 10, 1);
      soundManager.playWallHit({
        volume: 0.2 + normalizedVelocity * 0.4,
        pitch: 0.9 + normalizedVelocity * 0.3,
      });
    } else {
      soundManager.playWallHit();
    }
  }, []);

  const playDiceRoll = useCallback(() => {
    soundManager.playDiceRoll();
  }, []);

  const playGameOver = useCallback(() => {
    soundManager.playGameOver();
  }, []);

  const playWin = useCallback(() => {
    soundManager.playWin();
  }, []);

  const playImpact = useCallback(
    (velocity: number, type: "floor" | "wall" = "floor") => {
      soundManager.playImpact(velocity, type);
    },
    []
  );

  return {
    soundEnabled,
    toggleSound,
    setSoundEnabled: handleSetSoundEnabled,
    volume,
    setVolume: handleSetVolume,
    soundProfile,
    setSoundProfile: handleSetSoundProfile,
    playDiceHit,
    playWallHit,
    playDiceRoll,
    playGameOver,
    playWin,
    playImpact,
  };
}

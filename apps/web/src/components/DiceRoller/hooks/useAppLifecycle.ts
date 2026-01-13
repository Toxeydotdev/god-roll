/**
 * useAppLifecycle Hook
 *
 * Integrates with Capacitor App plugin to handle iOS/Android lifecycle events.
 * Ensures AudioContext is resumed when the app becomes active.
 */

import { App, type PluginListenerHandle } from "@capacitor/app";
import { useEffect, useRef } from "react";
import { musicManager } from "../utils/musicManager";
import { soundManager } from "../utils/soundManager";

/**
 * Hook to manage app lifecycle events and audio context resumption
 *
 * This hook listens to iOS/Android app state changes and automatically
 * resumes the AudioContext when the app becomes active. This is critical
 * for iOS where the AudioContext gets suspended when the app goes to background.
 */
export function useAppLifecycle(): void {
  const listenerHandle = useRef<PluginListenerHandle | null>(null);

  useEffect(() => {
    // Set up app state change listener
    const setupListener = async () => {
      try {
        listenerHandle.current = await App.addListener(
          "appStateChange",
          async (state) => {
            if (state.isActive) {
              // App came to foreground - resume audio context and music
              try {
                await soundManager.resume();
              } catch {
                // User can still interact to resume audio manually
              }

              // Also resume background music if it was playing
              try {
                await musicManager.resume();
              } catch {
                // Music will resume on next user interaction
              }
            }
          }
        );
      } catch {
        // Capacitor App plugin not available (running in browser)
      }
    };

    setupListener();

    // Cleanup listener on unmount
    return () => {
      if (listenerHandle.current) {
        listenerHandle.current.remove();
        listenerHandle.current = null;
      }
    };
  }, []);
}

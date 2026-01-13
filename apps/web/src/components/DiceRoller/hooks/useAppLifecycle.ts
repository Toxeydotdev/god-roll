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
        console.log("[useAppLifecycle] Setting up app state listener");

        listenerHandle.current = await App.addListener(
          "appStateChange",
          async (state) => {
            console.log(
              `[useAppLifecycle] App state changed to: ${
                state.isActive ? "active" : "background"
              }`
            );

            if (state.isActive) {
              // App came to foreground - resume audio context and music
              const audioState = soundManager.getState();
              console.log(
                `[useAppLifecycle] App became active - AudioContext state: ${audioState}`
              );

              try {
                await soundManager.resume();
                console.log(
                  "[useAppLifecycle] AudioContext resume completed successfully"
                );
              } catch (error) {
                console.error(
                  "[useAppLifecycle] Failed to resume AudioContext:",
                  error
                );
                // Error is logged but we don't want to crash the app
                // User can still interact to resume audio manually
              }

              // Also resume background music if it was playing
              try {
                await musicManager.resume();
                console.log("[useAppLifecycle] Music resume completed");
              } catch (error) {
                console.error(
                  "[useAppLifecycle] Failed to resume music:",
                  error
                );
              }
            } else {
              // App went to background
              const audioState = soundManager.getState();
              console.log(
                `[useAppLifecycle] App went to background - AudioContext state: ${audioState}`
              );
            }
          }
        );

        console.log("[useAppLifecycle] App state listener registered");
      } catch (error) {
        // If Capacitor App plugin is not available (e.g., running in browser),
        // this is expected and should not cause issues
        console.log(
          "[useAppLifecycle] App plugin not available (likely running in browser):",
          error
        );
      }
    };

    setupListener();

    // Cleanup listener on unmount
    return () => {
      if (listenerHandle.current) {
        console.log("[useAppLifecycle] Removing app state listener");
        listenerHandle.current.remove();
        listenerHandle.current = null;
      }
    };
  }, []);
}

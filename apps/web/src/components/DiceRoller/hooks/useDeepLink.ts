/**
 * useDeepLink - Handles deep link URL opens for auth callbacks
 *
 * Listens for app URL open events (e.g., godroll://auth/callback)
 * and processes Supabase auth tokens from the URL hash.
 */

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import { supabase } from "../../../lib/supabase";

/**
 * Hook to handle deep link callbacks from Supabase auth emails
 * (email confirmation, password reset, etc.)
 */
export function useDeepLink(): void {
  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Handle URL open events (deep links)
    const handleAppUrlOpen = async ({
      url,
    }: {
      url: string;
    }): Promise<void> => {
      console.log("Deep link received:", url);

      // Check if this is an auth callback
      if (url.includes("auth/callback")) {
        // Extract the hash fragment (contains access_token, refresh_token, etc.)
        const hashIndex = url.indexOf("#");
        if (hashIndex !== -1 && supabase) {
          const hashFragment = url.substring(hashIndex + 1);
          const params = new URLSearchParams(hashFragment);

          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            // Set the session from the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error("Error setting session from deep link:", error);
            } else {
              console.log("Session set successfully from deep link");
            }
          }
        }
      }
    };

    // Add listener for URL opens
    const listener = App.addListener("appUrlOpen", handleAppUrlOpen);

    // Cleanup listener on unmount
    return () => {
      listener.then((l) => l.remove());
    };
  }, []);
}

/**
 * useScreenOrientation - Hook to lock screen orientation on mobile devices
 *
 * This hook locks the screen to portrait orientation on native mobile platforms
 * using Capacitor's ScreenOrientation plugin. It gracefully handles web environments
 * where the API isn't available.
 */

import { useEffect } from 'react';

export function useScreenOrientation(): void {
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        // Dynamic import to avoid issues in web-only builds
        const { ScreenOrientation } = await import('@capacitor/screen-orientation');
        await ScreenOrientation.lock({ orientation: 'portrait' });
      } catch {
        // Gracefully handle - web browser or plugin not available
        // This is expected behavior in web environments
      }
    };

    lockOrientation();
  }, []);
}

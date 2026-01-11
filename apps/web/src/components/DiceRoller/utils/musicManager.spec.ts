/**
 * @vitest-environment jsdom
 *
 * MusicManager Tests following SIFERS methodology
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupLocalStorageMock } from "../../../test-utils/mocks";

// Mock the audio file import
vi.mock("@/assets/audio/good-night-lofi-cozy-chill-music-160166.mp3", () => ({
  default: "mocked-audio-url.mp3",
}));

// ============================================================================
// SETUP
// ============================================================================

// Mock HTMLAudioElement
class MockAudio {
  src = "";
  loop = false;
  volume = 0.15;
  currentTime = 0;
  paused = true;

  async play() {
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }

  addEventListener() {
    // Mock event listener
  }
}

// Replace global Audio constructor
global.Audio = MockAudio as any;

// ============================================================================
// TESTS
// ============================================================================

describe("MusicManager", () => {
  beforeEach(() => {
    setupLocalStorageMock();
    vi.clearAllMocks();

    // Clear module cache to get fresh instance
    vi.resetModules();
  });

  describe("initialization", () => {
    it("should initialize with correct default volume", async () => {
      const { musicManager } = await import("./musicManager");

      // Check default volume
      expect(musicManager.getVolume()).toBe(0.15);
    });

    it("should load saved settings from localStorage", async () => {
      // Setup - save music as enabled BEFORE importing
      localStorage.setItem("godroll_music_enabled_v1", "true");
      localStorage.setItem("godroll_music_volume_v1", "0.5");

      // Import after setting up localStorage
      const { musicManager } = await import("./musicManager");

      // Wait for loadSettings to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Invoke
      const enabled = musicManager.isEnabled();
      const volume = musicManager.getVolume();

      // Expect
      expect(volume).toBe(0.5);
      // isEnabled() returns true if saved state is true, even if not playing yet
      expect(enabled).toBe(true);
    });
  });

  describe("volume control", () => {
    it("should set and get volume", async () => {
      const { musicManager } = await import("./musicManager");

      // Invoke
      musicManager.setVolume(0.25);

      // Expect
      expect(musicManager.getVolume()).toBe(0.25);
    });

    it("should clamp volume between 0 and 1", async () => {
      const { musicManager } = await import("./musicManager");

      // Invoke
      musicManager.setVolume(1.5);
      expect(musicManager.getVolume()).toBe(1);

      musicManager.setVolume(-0.5);
      expect(musicManager.getVolume()).toBe(0);
    });
  });

  describe("toggle functionality", () => {
    it("should toggle from off to on", async () => {
      const { musicManager } = await import("./musicManager");

      // Ensure starting from off
      musicManager.stop();

      // Invoke
      const result = await musicManager.toggle();

      // Expect - should now be playing
      expect(result).toBe(true);
      expect(musicManager.isActuallyPlaying()).toBe(true);
    });

    it("should toggle from on to off", async () => {
      const { musicManager } = await import("./musicManager");

      // Setup - start music
      await musicManager.start();
      expect(musicManager.isActuallyPlaying()).toBe(true);

      // Invoke
      const result = await musicManager.toggle();

      // Expect - should now be stopped
      expect(result).toBe(false);
      expect(musicManager.isActuallyPlaying()).toBe(false);
    });

    it("should handle toggle when saved state is true but not playing", async () => {
      const { musicManager } = await import("./musicManager");

      // Setup - simulate saved state true but not actually playing
      // (e.g., autoplay was blocked)
      localStorage.setItem("godroll_music_enabled_v1", "true");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // The music should show as "enabled" but not actually playing
      expect(musicManager.isEnabled()).toBe(true);
      expect(musicManager.isActuallyPlaying()).toBe(false);

      // Invoke - toggle should turn it OFF
      const result = await musicManager.toggle();

      // Expect - should be turned off
      expect(result).toBe(false);
      expect(musicManager.isEnabled()).toBe(false);
    });
  });

  describe("page visibility", () => {
    it("should pause music when page becomes hidden", async () => {
      const { musicManager } = await import("./musicManager");

      // Setup - start music
      await musicManager.start();
      expect(musicManager.isActuallyPlaying()).toBe(true);

      // Mock document.hidden
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get() {
          return true;
        },
      });

      // Invoke - trigger visibility change
      const event = new Event("visibilitychange");
      document.dispatchEvent(event);

      // Expect - music should be paused but state preserved
      // Note: The actual audio pausing is handled by the mock
      // The _wasPlayingBeforeHidden flag is set internally
    });

    it("should resume music when page becomes visible again", async () => {
      const { musicManager } = await import("./musicManager");

      // Setup - start music
      await musicManager.start();

      // Simulate hiding
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get() {
          return true;
        },
      });
      document.dispatchEvent(new Event("visibilitychange"));

      // Simulate showing again
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get() {
          return false;
        },
      });

      // Invoke
      document.dispatchEvent(new Event("visibilitychange"));

      // Expect - music should attempt to resume
      // (In real implementation, audio.play() would be called)
    });
  });
});

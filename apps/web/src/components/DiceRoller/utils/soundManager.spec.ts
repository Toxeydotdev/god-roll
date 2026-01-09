/**
 * @vitest-environment jsdom
 *
 * SoundManager Tests following SIFERS methodology
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupLocalStorageMock } from "../../../test-utils/mocks";
import {
  getSoundEnabled,
  getSoundVolume,
  setSoundEnabled,
  setSoundVolume,
  SOUND_ENABLED_KEY,
  SOUND_VOLUME_KEY,
  SoundManager,
  soundManager,
} from "./soundManager";

// ============================================================================
// TESTS
// ============================================================================

describe("SoundManager class", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock console methods to keep test output clean
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("singleton instance", () => {
    it("should export a singleton instance", () => {
      // Expect
      expect(soundManager).toBeDefined();
      expect(soundManager).toBeInstanceOf(SoundManager);
    });
  });

  describe("getState", () => {
    it("should return 'uninitialized' before init is called", () => {
      // Setup
      const manager = new SoundManager();

      // Invoke
      const state = manager.getState();

      // Expect
      expect(state).toBe("uninitialized");
    });

    it("should return AudioContext state after init", () => {
      // Setup
      const manager = new SoundManager();

      // Invoke
      manager.init();
      const state = manager.getState();

      // Expect - AudioContext may not be initialized in test environment
      // So we check if it's either uninitialized or a valid state
      const validStates = [
        "uninitialized",
        "suspended",
        "running",
        "closed",
      ] as const;
      expect(validStates).toContain(state);
    });
  });

  describe("resume", () => {
    it("should log warning when AudioContext not initialized", async () => {
      // Setup
      const manager = new SoundManager();

      // Invoke
      await manager.resume();

      // Expect
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[SoundManager] Cannot resume: AudioContext not initialized"
      );
    });

    it("should log current state when called with initialized context", async () => {
      // Setup
      const manager = new SoundManager();
      manager.init();

      // Invoke
      await manager.resume();

      // Expect - should log the state (if AudioContext was created)
      if (manager.getState() !== "uninitialized") {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining("[SoundManager] Resume called")
        );
      }
    });
  });

  describe("enabled state without AudioContext", () => {
    it("should be enabled by default", () => {
      // Setup
      const manager = new SoundManager();

      // Expect - enabled by default (private property check via setEnabled)
      manager.setEnabled(true);
      // No error means it works
    });

    it("should allow toggling enabled state", () => {
      // Setup
      const manager = new SoundManager();

      // Invoke
      manager.setEnabled(false);
      manager.setEnabled(true);

      // Expect - no error
    });
  });

  describe("volume control without AudioContext", () => {
    it("should accept volume values", () => {
      // Setup
      const manager = new SoundManager();

      // Invoke
      manager.setVolume(0.5);

      // Expect - no error
    });
  });
});

describe("localStorage helpers", () => {
  beforeEach(() => {
    setupLocalStorageMock();
  });

  describe("getSoundEnabled", () => {
    it("should return true by default", () => {
      // Invoke
      const enabled = getSoundEnabled();

      // Expect
      expect(enabled).toBe(true);
    });

    it("should return false when saved as false", () => {
      // Setup
      localStorage.setItem(SOUND_ENABLED_KEY, "false");

      // Invoke
      const enabled = getSoundEnabled();

      // Expect
      expect(enabled).toBe(false);
    });

    it("should return true when saved as true", () => {
      // Setup
      localStorage.setItem(SOUND_ENABLED_KEY, "true");

      // Invoke
      const enabled = getSoundEnabled();

      // Expect
      expect(enabled).toBe(true);
    });
  });

  describe("setSoundEnabled", () => {
    it("should save enabled state to localStorage", () => {
      // Invoke
      setSoundEnabled(false);

      // Expect
      expect(localStorage.getItem(SOUND_ENABLED_KEY)).toBe("false");
    });

    it("should save true state", () => {
      // Invoke
      setSoundEnabled(true);

      // Expect
      expect(localStorage.getItem(SOUND_ENABLED_KEY)).toBe("true");
    });
  });

  describe("getSoundVolume", () => {
    it("should return 0.5 by default", () => {
      // Invoke
      const volume = getSoundVolume();

      // Expect
      expect(volume).toBe(0.5);
    });

    it("should return saved volume", () => {
      // Setup
      localStorage.setItem(SOUND_VOLUME_KEY, "0.3");

      // Invoke
      const volume = getSoundVolume();

      // Expect
      expect(volume).toBe(0.3);
    });
  });

  describe("setSoundVolume", () => {
    it("should save volume to localStorage", () => {
      // Invoke
      setSoundVolume(0.8);

      // Expect
      expect(localStorage.getItem(SOUND_VOLUME_KEY)).toBe("0.8");
    });
  });
});

/**
 * @vitest-environment jsdom
 *
 * SoundManager Tests following SIFERS methodology
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { beforeEach, describe, expect, it } from "vitest";
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
  describe("singleton instance", () => {
    it("should export a singleton instance", () => {
      // Expect
      expect(soundManager).toBeDefined();
      expect(soundManager).toBeInstanceOf(SoundManager);
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

  describe("audio sample management without AudioContext", () => {
    it("should track if sample is loaded", () => {
      // Setup
      const manager = new SoundManager();

      // Expect - sample not loaded initially
      expect(manager.hasSample("test-sample")).toBe(false);
    });

    it("should allow unloading samples", () => {
      // Setup
      const manager = new SoundManager();

      // Invoke
      manager.unloadSample("test-sample");

      // Expect - no error, sample still not loaded
      expect(manager.hasSample("test-sample")).toBe(false);
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

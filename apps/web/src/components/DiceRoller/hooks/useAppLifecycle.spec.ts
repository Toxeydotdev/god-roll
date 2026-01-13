/**
 * @vitest-environment jsdom
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { soundManager } from "../utils/soundManager";
import { useAppLifecycle } from "./useAppLifecycle";

// Mock Capacitor App plugin
vi.mock("@capacitor/app", () => {
  const mockRemove = vi.fn();
  const mockAddListener = vi.fn();

  return {
    App: {
      addListener: mockAddListener,
    },
    mockAddListener, // Export for test access
    mockRemove, // Export for test access
  };
});

describe("useAppLifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to keep test output clean
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should set up app state listener on mount", async () => {
    const { App } = await import("@capacitor/app");
    const mockRemove = vi.fn();
    vi.mocked(App.addListener).mockResolvedValue({ remove: mockRemove });

    renderHook(() => useAppLifecycle());

    await waitFor(() => {
      expect(App.addListener).toHaveBeenCalledWith(
        "appStateChange",
        expect.any(Function)
      );
    });
  });

  it("should resume audio context when app becomes active", async () => {
    const { App } = await import("@capacitor/app");
    let stateChangeCallback: ((state: { isActive: boolean }) => void) | null =
      null;

    const mockRemove = vi.fn();
    vi.mocked(App.addListener).mockImplementation(async (event, callback) => {
      stateChangeCallback = callback;
      return { remove: mockRemove };
    });

    const resumeSpy = vi.spyOn(soundManager, "resume");

    renderHook(() => useAppLifecycle());

    await waitFor(() => {
      expect(stateChangeCallback).not.toBeNull();
    });

    // Simulate app becoming active
    if (stateChangeCallback) {
      await stateChangeCallback({ isActive: true });
    }

    expect(resumeSpy).toHaveBeenCalled();
  });

  it("should not resume audio when app goes to background", async () => {
    const { App } = await import("@capacitor/app");
    let stateChangeCallback: ((state: { isActive: boolean }) => void) | null =
      null;

    const mockRemove = vi.fn();
    vi.mocked(App.addListener).mockImplementation(async (event, callback) => {
      stateChangeCallback = callback;
      return { remove: mockRemove };
    });

    const resumeSpy = vi.spyOn(soundManager, "resume");

    renderHook(() => useAppLifecycle());

    await waitFor(() => {
      expect(stateChangeCallback).not.toBeNull();
    });

    // Simulate app going to background
    if (stateChangeCallback) {
      await stateChangeCallback({ isActive: false });
    }

    // Should not resume when going to background
    expect(resumeSpy).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully if resume fails", async () => {
    const { App } = await import("@capacitor/app");
    let stateChangeCallback: ((state: { isActive: boolean }) => void) | null =
      null;

    const mockRemove = vi.fn();
    vi.mocked(App.addListener).mockImplementation(async (event, callback) => {
      stateChangeCallback = callback;
      return { remove: mockRemove };
    });

    const resumeError = new Error("Resume failed");
    vi.spyOn(soundManager, "resume").mockRejectedValue(resumeError);

    renderHook(() => useAppLifecycle());

    await waitFor(() => {
      expect(stateChangeCallback).not.toBeNull();
    });

    // Should not throw when resume fails
    if (stateChangeCallback) {
      await expect(
        stateChangeCallback({ isActive: true })
      ).resolves.not.toThrow();
    }
  });

  it("should remove listener on unmount", async () => {
    const { App } = await import("@capacitor/app");
    const mockRemove = vi.fn();
    vi.mocked(App.addListener).mockResolvedValue({ remove: mockRemove });

    const { unmount } = renderHook(() => useAppLifecycle());

    await waitFor(() => {
      expect(App.addListener).toHaveBeenCalled();
    });

    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });

  it("should handle case when Capacitor App plugin is not available", async () => {
    const { App } = await import("@capacitor/app");
    vi.mocked(App.addListener).mockRejectedValue(
      new Error("App plugin not available in browser")
    );

    // Should not throw even if plugin unavailable
    expect(() => renderHook(() => useAppLifecycle())).not.toThrow();
  });
});

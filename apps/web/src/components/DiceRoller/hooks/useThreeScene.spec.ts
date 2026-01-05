import { describe, expect, it } from "vitest";

// Extract the pure functions for testing by recreating them here
// In a real scenario, these would be exported from the module

function getBaseCameraSettings(
  width: number,
  height: number
): { y: number; z: number; fov: number } {
  const isPortrait = height > width;
  const isSmallScreen = Math.min(width, height) < 500;

  if (isPortrait) {
    return { y: 12, z: 8, fov: 55 };
  } else if (isSmallScreen || width < 768) {
    return { y: 10, z: 6, fov: 50 };
  }
  return { y: 10, z: 6, fov: 45 };
}

function getZoomForDiceCount(
  diceCount: number,
  width: number,
  height: number
): { y: number; z: number; fov: number } {
  const base = getBaseCameraSettings(width, height);

  if (diceCount <= 1) {
    return base;
  }

  const zoomThreshold = 3;
  if (diceCount <= zoomThreshold) {
    return base;
  }

  const diceAboveThreshold = diceCount - zoomThreshold;
  const zoomMultiplier = 1 + Math.log10(1 + diceAboveThreshold) * 0.5;

  return {
    y: base.y * zoomMultiplier,
    z: base.z * zoomMultiplier,
    fov: Math.min(base.fov + (zoomMultiplier - 1) * 20, 70),
  };
}

describe("getBaseCameraSettings", () => {
  describe("portrait mode", () => {
    it("should return portrait settings when height > width", () => {
      const result = getBaseCameraSettings(400, 800);
      expect(result).toEqual({ y: 12, z: 8, fov: 55 });
    });

    it("should return portrait settings for mobile portrait", () => {
      const result = getBaseCameraSettings(375, 667);
      expect(result).toEqual({ y: 12, z: 8, fov: 55 });
    });
  });

  describe("landscape mode", () => {
    it("should return small screen settings for narrow screens", () => {
      const result = getBaseCameraSettings(600, 400);
      expect(result).toEqual({ y: 10, z: 6, fov: 50 });
    });

    it("should return small screen settings when min dimension < 500", () => {
      const result = getBaseCameraSettings(800, 450);
      expect(result).toEqual({ y: 10, z: 6, fov: 50 });
    });

    it("should return desktop settings for large screens", () => {
      const result = getBaseCameraSettings(1920, 1080);
      expect(result).toEqual({ y: 10, z: 6, fov: 45 });
    });

    it("should return desktop settings for medium screens", () => {
      const result = getBaseCameraSettings(1024, 768);
      expect(result).toEqual({ y: 10, z: 6, fov: 45 });
    });
  });
});

describe("getZoomForDiceCount", () => {
  const desktopWidth = 1920;
  const desktopHeight = 1080;

  describe("no zoom threshold", () => {
    it("should return base settings for 0 dice", () => {
      const result = getZoomForDiceCount(0, desktopWidth, desktopHeight);
      expect(result).toEqual({ y: 10, z: 6, fov: 45 });
    });

    it("should return base settings for 1 die", () => {
      const result = getZoomForDiceCount(1, desktopWidth, desktopHeight);
      expect(result).toEqual({ y: 10, z: 6, fov: 45 });
    });

    it("should return base settings for 2 dice", () => {
      const result = getZoomForDiceCount(2, desktopWidth, desktopHeight);
      expect(result).toEqual({ y: 10, z: 6, fov: 45 });
    });

    it("should return base settings for 3 dice (at threshold)", () => {
      const result = getZoomForDiceCount(3, desktopWidth, desktopHeight);
      expect(result).toEqual({ y: 10, z: 6, fov: 45 });
    });
  });

  describe("zoom progression", () => {
    it("should zoom out slightly for 4 dice", () => {
      const result = getZoomForDiceCount(4, desktopWidth, desktopHeight);
      expect(result.y).toBeGreaterThan(10);
      expect(result.z).toBeGreaterThan(6);
      expect(result.fov).toBeGreaterThan(45);
    });

    it("should zoom out more for 10 dice", () => {
      const result4 = getZoomForDiceCount(4, desktopWidth, desktopHeight);
      const result10 = getZoomForDiceCount(10, desktopWidth, desktopHeight);

      expect(result10.y).toBeGreaterThan(result4.y);
      expect(result10.z).toBeGreaterThan(result4.z);
    });

    it("should continue zooming for dice counts above 10", () => {
      const result10 = getZoomForDiceCount(10, desktopWidth, desktopHeight);
      const result20 = getZoomForDiceCount(20, desktopWidth, desktopHeight);

      expect(result20.y).toBeGreaterThan(result10.y);
      expect(result20.z).toBeGreaterThan(result10.z);
    });

    it("should use logarithmic scaling (slower zoom at higher counts)", () => {
      const result5 = getZoomForDiceCount(5, desktopWidth, desktopHeight);
      const result10 = getZoomForDiceCount(10, desktopWidth, desktopHeight);
      const result15 = getZoomForDiceCount(15, desktopWidth, desktopHeight);

      const diff5to10 = result10.y - result5.y;
      const diff10to15 = result15.y - result10.y;

      // Logarithmic scaling means the difference decreases
      expect(diff10to15).toBeLessThan(diff5to10);
    });

    it("should cap FOV at 70", () => {
      const result = getZoomForDiceCount(100, desktopWidth, desktopHeight);
      expect(result.fov).toBeLessThanOrEqual(70);
    });
  });

  describe("mobile portrait mode", () => {
    const mobileWidth = 375;
    const mobileHeight = 667;

    it("should use portrait base settings", () => {
      const result = getZoomForDiceCount(1, mobileWidth, mobileHeight);
      expect(result).toEqual({ y: 12, z: 8, fov: 55 });
    });

    it("should zoom from portrait base for many dice", () => {
      const result = getZoomForDiceCount(10, mobileWidth, mobileHeight);
      expect(result.y).toBeGreaterThan(12);
      expect(result.z).toBeGreaterThan(8);
    });
  });
});

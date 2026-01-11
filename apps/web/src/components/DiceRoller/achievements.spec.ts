/**
 * @vitest-environment jsdom
 *
 * Achievement System Tests following SIFERS methodology
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkAllSame,
  checkCloseCall,
  checkFullHouse,
  checkRollExact,
  checkRollSame,
  checkRollStraight,
  createDefaultProfile,
  getAchievementById,
  getAchievementsByCategory,
  getAllAchievementIds,
  getLocalAchievements,
  getLocalProfile,
  getOrCreatePlayerId,
  getVisibleAchievements,
  saveLocalAchievements,
  saveLocalProfile,
  type DiceFaceNumber,
} from "./achievements";

// ============================================================================
// SETUP
// ============================================================================

describe("Achievement System", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // Roll Check Functions
  // --------------------------------------------------------------------------
  describe("checkRollExact", () => {
    it("should return true for exact match (order independent)", () => {
      expect(checkRollExact([1, 1] as DiceFaceNumber[], [1, 1])).toBe(true);
      expect(checkRollExact([6, 6] as DiceFaceNumber[], [6, 6])).toBe(true);
      expect(checkRollExact([2, 1] as DiceFaceNumber[], [1, 2])).toBe(true);
    });

    it("should return false for non-matching rolls", () => {
      expect(checkRollExact([1, 2] as DiceFaceNumber[], [1, 1])).toBe(false);
      expect(checkRollExact([1, 1, 1] as DiceFaceNumber[], [1, 1])).toBe(false);
    });
  });

  describe("checkRollSame", () => {
    it("should return true when N dice show same value", () => {
      expect(checkRollSame([3, 3, 3] as DiceFaceNumber[], 3)).toBe(true);
      expect(checkRollSame([1, 2, 2, 2, 4] as DiceFaceNumber[], 3)).toBe(true);
    });

    it("should return false when not enough matching dice", () => {
      expect(checkRollSame([1, 2, 3] as DiceFaceNumber[], 3)).toBe(false);
      expect(checkRollSame([1, 1, 2, 3] as DiceFaceNumber[], 3)).toBe(false);
    });
  });

  describe("checkRollStraight", () => {
    it("should detect straights of required length", () => {
      expect(checkRollStraight([1, 2, 3, 4, 5] as DiceFaceNumber[], 5)).toBe(
        true
      );
      expect(checkRollStraight([2, 3, 4, 5, 6] as DiceFaceNumber[], 5)).toBe(
        true
      );
      expect(checkRollStraight([1, 2, 3, 4] as DiceFaceNumber[], 4)).toBe(true);
    });

    it("should return false for non-consecutive rolls", () => {
      expect(checkRollStraight([1, 2, 4, 5, 6] as DiceFaceNumber[], 5)).toBe(
        false
      );
      expect(checkRollStraight([1, 1, 2, 3, 4] as DiceFaceNumber[], 5)).toBe(
        false
      );
    });
  });

  describe("checkAllSame", () => {
    it("should return true when all dice show specified value", () => {
      expect(checkAllSame([6, 6, 6] as DiceFaceNumber[], 6)).toBe(true);
      expect(checkAllSame([6, 6, 6, 6, 6] as DiceFaceNumber[], 6)).toBe(true);
    });

    it("should return false when not all dice match", () => {
      expect(checkAllSame([6, 6, 5] as DiceFaceNumber[], 6)).toBe(false);
      expect(checkAllSame([1, 1] as DiceFaceNumber[], 1)).toBe(false); // Less than 3 dice
    });
  });

  describe("checkFullHouse", () => {
    it("should detect full house (3 of one + 2 of another)", () => {
      expect(checkFullHouse([1, 1, 1, 2, 2] as DiceFaceNumber[])).toBe(true);
      expect(checkFullHouse([3, 3, 3, 5, 5] as DiceFaceNumber[])).toBe(true);
      expect(checkFullHouse([4, 4, 4, 4, 2, 2] as DiceFaceNumber[])).toBe(true); // 4 of one + 2 of another
    });

    it("should return false for non-full-house rolls", () => {
      expect(checkFullHouse([1, 2, 3, 4, 5] as DiceFaceNumber[])).toBe(false);
      expect(checkFullHouse([1, 1, 1, 1] as DiceFaceNumber[])).toBe(false); // Less than 5 dice
      expect(checkFullHouse([1, 1, 2, 3, 4] as DiceFaceNumber[])).toBe(false);
    });
  });

  describe("checkCloseCall", () => {
    it("should detect rolls close to multiples of 7", () => {
      // 6 is 1 away from 7
      expect(checkCloseCall(6, 1)).toBe(true);
      // 8 is 1 away from 7
      expect(checkCloseCall(8, 1)).toBe(true);
      // 13 is 1 away from 14
      expect(checkCloseCall(13, 1)).toBe(true);
      // 15 is 1 away from 14
      expect(checkCloseCall(15, 1)).toBe(true);
    });

    it("should return false for rolls not close to 7 multiple", () => {
      expect(checkCloseCall(7, 1)).toBe(false); // Exactly 7
      expect(checkCloseCall(10, 1)).toBe(false); // 3 away from 7
    });
  });

  // --------------------------------------------------------------------------
  // Achievement Lookup Functions
  // --------------------------------------------------------------------------
  describe("getAchievementById", () => {
    it("should return achievement for valid ID", () => {
      const achievement = getAchievementById("snake_eyes");
      expect(achievement).toBeDefined();
      expect(achievement?.name).toBe("Snake Eyes");
    });

    it("should return undefined for invalid ID", () => {
      expect(getAchievementById("nonexistent")).toBeUndefined();
    });
  });

  describe("getAchievementsByCategory", () => {
    it("should return all achievements in a category", () => {
      const rollAchievements = getAchievementsByCategory("roll");
      expect(rollAchievements.length).toBeGreaterThan(0);
      expect(rollAchievements.every((a) => a.category === "roll")).toBe(true);
    });
  });

  describe("getVisibleAchievements", () => {
    it("should hide hidden achievements that are not unlocked", () => {
      const visible = getVisibleAchievements(new Set());
      const hasHiddenUnlocked = visible.some((a) => a.hidden);
      // Hidden achievements should not be in visible list if not unlocked
      expect(hasHiddenUnlocked).toBe(false);
    });

    it("should show hidden achievements that are unlocked", () => {
      const visible = getVisibleAchievements(new Set(["lucky_sevens"]));
      const luckySevenVisible = visible.some((a) => a.id === "lucky_sevens");
      expect(luckySevenVisible).toBe(true);
    });
  });

  describe("getAllAchievementIds", () => {
    it("should return all achievement IDs", () => {
      const ids = getAllAchievementIds();
      expect(ids.length).toBeGreaterThan(20);
      expect(ids).toContain("snake_eyes");
      expect(ids).toContain("perfectionist");
    });
  });

  // --------------------------------------------------------------------------
  // Profile Management
  // --------------------------------------------------------------------------
  describe("createDefaultProfile", () => {
    it("should create profile with default values", () => {
      const profile = createDefaultProfile("test-player-123");
      expect(profile.playerId).toBe("test-player-123");
      expect(profile.totalScore).toBe(0);
      expect(profile.totalGamesPlayed).toBe(0);
      expect(profile.unlockedSkins).toContain("cartoon");
      expect(profile.unlockedSkins).toContain("classic");
      expect(profile.unlockedThemes).toContain("green");
    });
  });

  describe("getOrCreatePlayerId", () => {
    it("should create and persist a player ID", () => {
      const id1 = getOrCreatePlayerId();
      expect(id1).toBeTruthy();
      expect(id1.length).toBeGreaterThan(10);

      // Should return same ID on subsequent calls
      const id2 = getOrCreatePlayerId();
      expect(id2).toBe(id1);
    });
  });

  describe("localStorage persistence", () => {
    it("should save and load profile from localStorage", () => {
      const profile = createDefaultProfile("test-player");
      profile.totalScore = 100;
      profile.totalGamesPlayed = 5;

      saveLocalProfile(profile);
      const loaded = getLocalProfile();

      expect(loaded).toBeDefined();
      expect(loaded?.totalScore).toBe(100);
      expect(loaded?.totalGamesPlayed).toBe(5);
    });

    it("should save and load achievements from localStorage", () => {
      const achievements = new Set(["snake_eyes", "boxcars", "first_roll"]);

      saveLocalAchievements(achievements);
      const loaded = getLocalAchievements();

      expect(loaded.has("snake_eyes")).toBe(true);
      expect(loaded.has("boxcars")).toBe(true);
      expect(loaded.has("first_roll")).toBe(true);
      expect(loaded.size).toBe(3);
    });

    it("should handle localStorage errors gracefully", () => {
      // Mock localStorage to throw
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      const profile = getLocalProfile();
      expect(profile).toBeNull();

      const achievements = getLocalAchievements();
      expect(achievements.size).toBe(0);
    });
  });
});

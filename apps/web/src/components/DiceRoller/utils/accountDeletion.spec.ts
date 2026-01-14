/**
 * @vitest-environment jsdom
 *
 * Account Deletion Service Tests following SIFERS methodology
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ============================================================================
// MOCKS - Must be hoisted, can't reference external variables
// ============================================================================

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ error: null }),
    },
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "test-user-id" } } }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// Import after mocking
import {
  clearLocalData,
  deleteAccount,
  deleteUserData,
  GODROLL_STORAGE_KEYS,
} from "./accountDeletion";

// ============================================================================
// SETUP
// ============================================================================

function setupLocalStorage() {
  // Populate localStorage with test data
  for (const key of GODROLL_STORAGE_KEYS) {
    localStorage.setItem(key, "test-value");
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe("Account Deletion Service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("clearLocalData", () => {
    it("should remove all godroll localStorage keys", () => {
      // Setup
      setupLocalStorage();

      // Verify data exists
      for (const key of GODROLL_STORAGE_KEYS) {
        expect(localStorage.getItem(key)).toBe("test-value");
      }

      // Invoke
      clearLocalData();

      // Expect all keys to be removed
      for (const key of GODROLL_STORAGE_KEYS) {
        expect(localStorage.getItem(key)).toBeNull();
      }
    });

    it("should not throw when localStorage is empty", () => {
      // Invoke - should not throw
      expect(() => clearLocalData()).not.toThrow();
    });

    it("should preserve non-godroll keys", () => {
      // Setup
      localStorage.setItem("other_app_key", "should-remain");
      setupLocalStorage();

      // Invoke
      clearLocalData();

      // Expect other keys to remain
      expect(localStorage.getItem("other_app_key")).toBe("should-remain");
    });
  });

  describe("deleteUserData", () => {
    it("should call supabase to delete from all tables", async () => {
      // Invoke
      const result = await deleteUserData("test-player-id");

      // Expect success
      expect(result.success).toBe(true);
    });
  });

  describe("deleteAccount", () => {
    it("should delete user data and clear local storage", async () => {
      // Setup
      setupLocalStorage();

      // Invoke
      const result = await deleteAccount("test-player-id");

      // Expect success
      expect(result.success).toBe(true);

      // Expect local storage to be cleared
      for (const key of GODROLL_STORAGE_KEYS) {
        expect(localStorage.getItem(key)).toBeNull();
      }
    });
  });

  describe("GODROLL_STORAGE_KEYS", () => {
    it("should include all known localStorage keys", () => {
      // This test ensures we don't forget to add new keys
      const expectedKeys = [
        "godroll_profile_v1",
        "godroll_achievements_v1",
        "godroll_player_id_v1",
        "godroll_leaderboard_v1",
        "godroll_theme_v1",
        "godroll_dice_skin_v1",
        "godroll_sound_enabled_v1",
        "godroll_sound_volume_v1",
        "godroll_music_enabled_v1",
        "godroll_music_volume_v1",
        "godroll_online_mode_v1",
        "godroll_player_name_v1",
      ];

      expect(GODROLL_STORAGE_KEYS).toEqual(expectedKeys);
    });
  });
});

/**
 * @vitest-environment jsdom
 *
 * Leaderboard User Interaction Tests following SIFERS methodology:
 * - Setup: Prepare test environment and dependencies
 * - Invoke: Trigger user actions
 * - Find: Locate affected elements
 * - Expect: Assert expected outcomes
 * - Reset: Clean up after test
 * - Snapshot: (optional) Visual validation
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addLeaderboardEntry,
  clearLeaderboard,
  getLeaderboard,
  LeaderboardEntry,
} from "./leaderboard";

describe("leaderboard - User Interactions", () => {
  // SETUP: Clean environment before each test
  beforeEach(() => {
    localStorage.clear();
  });

  // RESET: Clean up after each test
  afterEach(() => {
    localStorage.clear();
  });

  describe("when user first opens leaderboard", () => {
    it("should show empty state with no previous games", () => {
      // SETUP: Fresh localStorage (already done in beforeEach)

      // INVOKE: User opens leaderboard
      const entries = getLeaderboard();

      // EXPECT: Empty leaderboard
      expect(entries).toEqual([]);
      expect(entries).toHaveLength(0);
    });
  });

  describe("when user completes a game", () => {
    it("should add their score to the leaderboard", () => {
      // SETUP: User finishes game with score 150 in 4 rounds
      const entry: LeaderboardEntry = {
        score: 150,
        rounds: 4,
        date: "2024-01-15T10:30:00.000Z",
      };

      // INVOKE: Game saves score to leaderboard
      const result = addLeaderboardEntry(entry);

      // FIND: Check leaderboard contents
      const leaderboard = getLeaderboard();

      // EXPECT: Score should appear in leaderboard
      expect(result).toHaveLength(1);
      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0].score).toBe(150);
      expect(leaderboard[0].rounds).toBe(4);
    });

    it("should rank multiple scores from highest to lowest", () => {
      // SETUP: User plays multiple games
      const games: LeaderboardEntry[] = [
        { score: 75, rounds: 3, date: "2024-01-15T10:00:00.000Z" },
        { score: 200, rounds: 5, date: "2024-01-15T11:00:00.000Z" },
        { score: 125, rounds: 4, date: "2024-01-15T12:00:00.000Z" },
      ];

      // INVOKE: Save each game result
      for (const game of games) {
        addLeaderboardEntry(game);
      }

      // FIND: Get leaderboard
      const leaderboard = getLeaderboard();

      // EXPECT: Scores sorted high to low
      expect(leaderboard[0].score).toBe(200);
      expect(leaderboard[1].score).toBe(125);
      expect(leaderboard[2].score).toBe(75);
    });
  });

  describe("when leaderboard reaches max capacity", () => {
    it("should keep only top 5 scores", () => {
      // SETUP: User is a dedicated player with many games
      const games: LeaderboardEntry[] = [];
      for (let i = 1; i <= 10; i++) {
        games.push({
          score: i * 10, // Scores: 10, 20, 30, ... 100
          rounds: i,
          date: new Date().toISOString(),
        });
      }

      // INVOKE: Save all games
      for (const game of games) {
        addLeaderboardEntry(game);
      }

      // FIND: Check leaderboard
      const leaderboard = getLeaderboard();

      // EXPECT: Only top 5 scores kept
      expect(leaderboard).toHaveLength(5);
      expect(leaderboard[0].score).toBe(100); // Highest
      expect(leaderboard[4].score).toBe(60); // 5th highest
    });

    it("should drop lowest score when new high score added", () => {
      // SETUP: Fill leaderboard with 5 entries
      for (let i = 1; i <= 5; i++) {
        addLeaderboardEntry({
          score: i * 10,
          rounds: i,
          date: new Date().toISOString(),
        });
      }

      // INVOKE: User beats their best score
      addLeaderboardEntry({
        score: 500,
        rounds: 6,
        date: new Date().toISOString(),
      });

      // FIND: Get updated leaderboard
      const leaderboard = getLeaderboard();

      // EXPECT: New high score at top, lowest score dropped
      expect(leaderboard).toHaveLength(5);
      expect(leaderboard[0].score).toBe(500);
      expect(leaderboard.find((e) => e.score === 10)).toBeUndefined(); // Lowest dropped
    });
  });

  describe("when user wants to reset leaderboard", () => {
    it("should clear all entries", () => {
      // SETUP: Leaderboard has entries
      addLeaderboardEntry({
        score: 100,
        rounds: 3,
        date: new Date().toISOString(),
      });
      addLeaderboardEntry({
        score: 200,
        rounds: 4,
        date: new Date().toISOString(),
      });
      expect(getLeaderboard()).toHaveLength(2);

      // INVOKE: User clears leaderboard
      clearLeaderboard();

      // FIND & EXPECT: Leaderboard should be empty
      expect(getLeaderboard()).toEqual([]);
      expect(localStorage.getItem("godroll_leaderboard_v1")).toBeNull();
    });
  });

  describe("when leaderboard data is corrupted", () => {
    it("should handle invalid JSON gracefully", () => {
      // SETUP: Somehow localStorage got corrupted
      localStorage.setItem("godroll_leaderboard_v1", "{ invalid json }}}");

      // INVOKE: User opens leaderboard
      const entries = getLeaderboard();

      // EXPECT: Should return empty array, not crash
      expect(entries).toEqual([]);
    });

    it("should allow adding new entries after corruption", () => {
      // SETUP: Corrupted data
      localStorage.setItem("godroll_leaderboard_v1", "not valid json");

      // INVOKE: User completes a game
      const result = addLeaderboardEntry({
        score: 100,
        rounds: 3,
        date: new Date().toISOString(),
      });

      // EXPECT: New entry should be saved
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(100);
    });
  });

  describe("leaderboard data persistence", () => {
    it("should persist scores across browser sessions (simulated)", () => {
      // SETUP: User plays and closes browser
      addLeaderboardEntry({
        score: 250,
        rounds: 5,
        date: "2024-01-10T08:00:00.000Z",
      });

      // INVOKE: Simulate "reopening" browser (just read from storage)
      const afterReopen = getLeaderboard();

      // EXPECT: Score should still be there
      expect(afterReopen).toHaveLength(1);
      expect(afterReopen[0].score).toBe(250);
    });
  });
});

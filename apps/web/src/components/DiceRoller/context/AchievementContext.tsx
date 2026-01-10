/**
 * AchievementContext - Centralized achievement tracking and management
 *
 * Provides:
 * - User profile state (scores, games played, streaks)
 * - Achievement unlock detection
 * - Toast notifications for new achievements
 * - Local + optional cloud persistence
 */

import {
  Achievement,
  ACHIEVEMENTS,
  checkAchievements,
  createDefaultProfile,
  getAchievementById,
  getLocalAchievements,
  getLocalProfile,
  getOrCreatePlayerId,
  saveLocalAchievements,
  saveLocalProfile,
  UserProfile,
} from "@/components/DiceRoller/achievements";
import type { DiceFaceNumber } from "@/components/DiceRoller/types";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface AchievementUnlock {
  achievement: Achievement;
  unlockedAt: string;
}

interface AchievementContextValue {
  // Profile data
  profile: UserProfile;
  playerId: string;

  // Achievement state
  unlockedAchievements: Set<string>;
  recentUnlocks: AchievementUnlock[];

  // Actions
  checkForAchievements: (
    roll: DiceFaceNumber[],
    rollTotal: number,
    gameScore: number,
    roundNumber: number,
    isFirstRoll: boolean
  ) => string[];
  onGameEnd: (finalScore: number, roundsSurvived: number) => void;
  dismissRecentUnlock: (achievementId: string) => void;
  clearAllRecentUnlocks: () => void;

  // Computed
  totalAchievements: number;
  unlockedCount: number;
  progressPercentage: number;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AchievementContext = createContext<AchievementContextValue | undefined>(
  undefined
);

// ============================================================================
// PROVIDER
// ============================================================================

interface AchievementProviderProps {
  children: ReactNode;
}

export function AchievementProvider({
  children,
}: AchievementProviderProps): React.ReactElement {
  // Initialize player ID (persisted across sessions)
  const playerId = useMemo(() => getOrCreatePlayerId(), []);

  // Profile state
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = getLocalProfile();
    return saved || createDefaultProfile(playerId);
  });

  // Achievement state
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(
    () => getLocalAchievements()
  );

  // Recent unlocks for toast notifications
  const [recentUnlocks, setRecentUnlocks] = useState<AchievementUnlock[]>([]);

  // Track roll history for current game session
  const rollHistoryRef = useRef<DiceFaceNumber[][]>([]);

  // Save profile changes to localStorage
  useEffect(() => {
    saveLocalProfile(profile);
  }, [profile]);

  // Save achievements to localStorage
  useEffect(() => {
    saveLocalAchievements(unlockedAchievements);
  }, [unlockedAchievements]);

  /**
   * Check for newly unlocked achievements after each roll
   */
  const checkForAchievements = useCallback(
    (
      roll: DiceFaceNumber[],
      rollTotal: number,
      gameScore: number,
      roundNumber: number,
      isFirstRoll: boolean
    ): string[] => {
      // Track roll in history
      rollHistoryRef.current.push([...roll]);

      // Check all achievement conditions
      const newlyUnlocked = checkAchievements(
        roll,
        rollTotal,
        gameScore,
        roundNumber,
        profile,
        unlockedAchievements,
        isFirstRoll
      );

      if (newlyUnlocked.length > 0) {
        const now = new Date().toISOString();

        // Update unlocked set
        setUnlockedAchievements((prev) => {
          const next = new Set(prev);
          for (const id of newlyUnlocked) {
            next.add(id);
          }
          return next;
        });

        // Add to recent unlocks for toast display
        const newUnlocks: AchievementUnlock[] = newlyUnlocked
          .map((id) => {
            const achievement = getAchievementById(id);
            return achievement ? { achievement, unlockedAt: now } : null;
          })
          .filter((u): u is AchievementUnlock => u !== null);

        setRecentUnlocks((prev) => [...prev, ...newUnlocks]);

        // Update profile with any unlocked skins/themes
        setProfile((prev) => {
          const updated = { ...prev, updatedAt: now };

          for (const id of newlyUnlocked) {
            const achievement = getAchievementById(id);
            if (!achievement) continue;

            const { reward } = achievement;
            if (
              reward.type === "dice_skin" &&
              !updated.unlockedSkins.includes(reward.value)
            ) {
              updated.unlockedSkins = [...updated.unlockedSkins, reward.value];
            } else if (
              reward.type === "theme" &&
              !updated.unlockedThemes.includes(reward.value)
            ) {
              updated.unlockedThemes = [
                ...updated.unlockedThemes,
                reward.value,
              ];
            } else if (
              reward.type === "badge" &&
              !updated.equippedBadges.includes(reward.value)
            ) {
              updated.equippedBadges = [
                ...updated.equippedBadges,
                reward.value,
              ];
            }
          }

          return updated;
        });
      }

      return newlyUnlocked;
    },
    [profile, unlockedAchievements]
  );

  /**
   * Called when a game ends - updates profile stats
   */
  const onGameEnd = useCallback(
    (finalScore: number, roundsSurvived: number) => {
      const now = new Date().toISOString();

      setProfile((prev) => {
        // Calculate streak
        const isWinningGame = finalScore >= 50; // Define "win" as 50+ points
        const newStreak = isWinningGame ? prev.currentStreak + 1 : 0;

        // Calculate consecutive days
        const lastPlayed = new Date(prev.lastPlayedAt);
        const today = new Date();
        const daysSinceLastPlay = Math.floor(
          (today.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24)
        );

        let consecutiveDays = prev.consecutiveDays;
        if (daysSinceLastPlay === 1) {
          consecutiveDays += 1;
        } else if (daysSinceLastPlay > 1) {
          consecutiveDays = 1;
        }
        // Same day = no change

        return {
          ...prev,
          totalScore: prev.totalScore + finalScore,
          totalGamesPlayed: prev.totalGamesPlayed + 1,
          highestScore: Math.max(prev.highestScore, finalScore),
          highestRound: Math.max(prev.highestRound, roundsSurvived),
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          lastPlayedAt: now,
          consecutiveDays,
          updatedAt: now,
        };
      });

      // Clear roll history for next game
      rollHistoryRef.current = [];

      // Check for end-of-game achievements (games_played, score_lifetime, etc.)
      // This is handled in checkForAchievements on the last roll
    },
    []
  );

  /**
   * Dismiss a recent unlock toast
   */
  const dismissRecentUnlock = useCallback((achievementId: string) => {
    setRecentUnlocks((prev) =>
      prev.filter((u) => u.achievement.id !== achievementId)
    );
  }, []);

  /**
   * Clear all recent unlock toasts
   */
  const clearAllRecentUnlocks = useCallback(() => {
    setRecentUnlocks([]);
  }, []);

  // Computed values
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlockedAchievements.size;
  const progressPercentage = Math.round(
    (unlockedCount / totalAchievements) * 100
  );

  const value: AchievementContextValue = useMemo(
    () => ({
      profile,
      playerId,
      unlockedAchievements,
      recentUnlocks,
      checkForAchievements,
      onGameEnd,
      dismissRecentUnlock,
      clearAllRecentUnlocks,
      totalAchievements,
      unlockedCount,
      progressPercentage,
    }),
    [
      profile,
      playerId,
      unlockedAchievements,
      recentUnlocks,
      checkForAchievements,
      onGameEnd,
      dismissRecentUnlock,
      clearAllRecentUnlocks,
      totalAchievements,
      unlockedCount,
      progressPercentage,
    ]
  );

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useAchievements(): AchievementContextValue {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error(
      "useAchievements must be used within an AchievementProvider"
    );
  }
  return context;
}

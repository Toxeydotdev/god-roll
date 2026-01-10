/**
 * Achievement Service - Cloud sync for profiles and achievements
 *
 * Handles syncing user profiles and achievements with Supabase.
 * Supports merging local (guest) data when user creates an account.
 */

import { isSupabaseConfigured, supabase } from "../../../lib/supabase";
import type { PlayerAchievementProgress, UserProfile } from "../achievements";

// ============================================================================
// TYPES
// ============================================================================

export interface SyncResult {
  success: boolean;
  error?: string;
  profile?: UserProfile;
  achievements?: PlayerAchievementProgress[];
}

export interface MergeResult {
  profile: UserProfile;
  achievements: PlayerAchievementProgress[];
}

// ============================================================================
// CLOUD PROFILE OPERATIONS
// ============================================================================

/**
 * Fetch user profile from the cloud
 */
export async function fetchCloudProfile(
  userId: string
): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    // Map database fields to UserProfile
    return {
      id: data.id,
      playerId: data.user_id,
      displayName: data.display_name,
      totalScore: data.total_score,
      totalGamesPlayed: data.games_played,
      highestScore: data.highest_score,
      highestRound: data.highest_round,
      currentStreak: data.current_streak,
      bestStreak: data.best_streak,
      lastPlayedAt: data.last_played_at || new Date().toISOString(),
      consecutiveDays: data.consecutive_days,
      unlockedSkins: data.unlocked_skins || ["cartoon", "classic"],
      unlockedThemes: data.unlocked_themes || ["green"],
      equippedBadges: data.equipped_badges || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("Error fetching cloud profile:", error);
    return null;
  }
}

/**
 * Save user profile to the cloud (upsert)
 */
export async function saveCloudProfile(
  userId: string,
  profile: UserProfile
): Promise<SyncResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const { error } = await supabase.from("user_profiles").upsert(
      {
        id: profile.id,
        user_id: userId,
        display_name: profile.displayName,
        total_score: profile.totalScore,
        games_played: profile.totalGamesPlayed,
        highest_score: profile.highestScore,
        highest_round: profile.highestRound,
        current_streak: profile.currentStreak,
        best_streak: profile.bestStreak,
        last_played_at: profile.lastPlayedAt,
        consecutive_days: profile.consecutiveDays,
        unlocked_skins: profile.unlockedSkins,
        unlocked_themes: profile.unlockedThemes,
        equipped_badges: profile.equippedBadges,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Error saving cloud profile:", error);
      return { success: false, error: error.message };
    }

    return { success: true, profile };
  } catch (error) {
    console.error("Error saving cloud profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// CLOUD ACHIEVEMENT OPERATIONS
// ============================================================================

/**
 * Fetch user achievements from the cloud
 */
export async function fetchCloudAchievements(
  userId: string
): Promise<PlayerAchievementProgress[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId);

    if (error || !data) {
      return [];
    }

    return data.map((item) => ({
      achievementId: item.achievement_id,
      unlockedAt: item.unlocked_at,
      progress: item.progress || undefined,
    }));
  } catch (error) {
    console.error("Error fetching cloud achievements:", error);
    return [];
  }
}

/**
 * Save a single achievement unlock to the cloud
 */
export async function saveCloudAchievement(
  userId: string,
  achievement: PlayerAchievementProgress
): Promise<SyncResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const { error } = await supabase.from("user_achievements").upsert(
      {
        user_id: userId,
        achievement_id: achievement.achievementId,
        unlocked_at: achievement.unlockedAt,
        progress: achievement.progress || 0,
      },
      { onConflict: "user_id,achievement_id" }
    );

    if (error) {
      console.error("Error saving cloud achievement:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving cloud achievement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Bulk save all achievements to the cloud
 */
export async function saveAllCloudAchievements(
  userId: string,
  achievements: PlayerAchievementProgress[]
): Promise<SyncResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const records = achievements.map((a) => ({
      user_id: userId,
      achievement_id: a.achievementId,
      unlocked_at: a.unlockedAt,
      progress: a.progress || 0,
    }));

    const { error } = await supabase
      .from("user_achievements")
      .upsert(records, { onConflict: "user_id,achievement_id" });

    if (error) {
      console.error("Error saving cloud achievements:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving cloud achievements:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// MERGE OPERATIONS (for claiming guest progress)
// ============================================================================

/**
 * Merge local guest data with existing cloud data
 * Takes the best of both (higher scores, union of achievements)
 */
export function mergeProfileData(
  localProfile: UserProfile,
  cloudProfile: UserProfile | null
): UserProfile {
  if (!cloudProfile) {
    return localProfile;
  }

  const now = new Date().toISOString();

  return {
    ...cloudProfile,
    // Take the higher values
    totalScore: Math.max(localProfile.totalScore, cloudProfile.totalScore),
    totalGamesPlayed:
      localProfile.totalGamesPlayed + cloudProfile.totalGamesPlayed,
    highestScore: Math.max(
      localProfile.highestScore,
      cloudProfile.highestScore
    ),
    highestRound: Math.max(
      localProfile.highestRound,
      cloudProfile.highestRound
    ),
    bestStreak: Math.max(localProfile.bestStreak, cloudProfile.bestStreak),
    currentStreak: localProfile.currentStreak, // Use local current streak
    consecutiveDays: Math.max(
      localProfile.consecutiveDays,
      cloudProfile.consecutiveDays
    ),
    // Merge unlocked items (union)
    unlockedSkins: [
      ...new Set([
        ...localProfile.unlockedSkins,
        ...cloudProfile.unlockedSkins,
      ]),
    ],
    unlockedThemes: [
      ...new Set([
        ...localProfile.unlockedThemes,
        ...cloudProfile.unlockedThemes,
      ]),
    ],
    equippedBadges: [
      ...new Set([
        ...localProfile.equippedBadges,
        ...cloudProfile.equippedBadges,
      ]),
    ],
    lastPlayedAt: now,
    updatedAt: now,
  };
}

/**
 * Merge achievements (union, keep earliest unlock times)
 */
export function mergeAchievementData(
  localAchievements: PlayerAchievementProgress[],
  cloudAchievements: PlayerAchievementProgress[]
): PlayerAchievementProgress[] {
  const merged = new Map<string, PlayerAchievementProgress>();

  // Add all cloud achievements first
  for (const achievement of cloudAchievements) {
    merged.set(achievement.achievementId, achievement);
  }

  // Merge local achievements (keep earliest unlock time)
  for (const localAchievement of localAchievements) {
    const existing = merged.get(localAchievement.achievementId);
    if (!existing) {
      merged.set(localAchievement.achievementId, localAchievement);
    } else if (localAchievement.unlockedAt && existing.unlockedAt) {
      // Keep the earlier unlock time
      const localTime = new Date(localAchievement.unlockedAt).getTime();
      const cloudTime = new Date(existing.unlockedAt).getTime();
      if (localTime < cloudTime) {
        merged.set(localAchievement.achievementId, localAchievement);
      }
    } else if (localAchievement.unlockedAt && !existing.unlockedAt) {
      // Local has unlock, cloud doesn't
      merged.set(localAchievement.achievementId, localAchievement);
    }
  }

  return Array.from(merged.values());
}

// ============================================================================
// FULL SYNC OPERATION
// ============================================================================

/**
 * Full sync: merge local + cloud, save merged result to cloud
 * Used when user logs in to claim their guest progress
 */
export async function syncWithCloud(
  userId: string,
  localProfile: UserProfile,
  localAchievements: PlayerAchievementProgress[]
): Promise<SyncResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    // 1. Fetch existing cloud data
    const [cloudProfile, cloudAchievements] = await Promise.all([
      fetchCloudProfile(userId),
      fetchCloudAchievements(userId),
    ]);

    // 2. Merge local and cloud data
    const mergedProfile = mergeProfileData(localProfile, cloudProfile);
    const mergedAchievements = mergeAchievementData(
      localAchievements,
      cloudAchievements
    );

    // 3. Update the merged profile's playerId to match the authenticated user
    mergedProfile.playerId = userId;

    // 4. Save merged data back to cloud
    const [profileResult, achievementsResult] = await Promise.all([
      saveCloudProfile(userId, mergedProfile),
      saveAllCloudAchievements(userId, mergedAchievements),
    ]);

    if (!profileResult.success) {
      return profileResult;
    }

    if (!achievementsResult.success) {
      return achievementsResult;
    }

    return {
      success: true,
      profile: mergedProfile,
      achievements: mergedAchievements,
    };
  } catch (error) {
    console.error("Error during cloud sync:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Download cloud data (for when user logs in on a new device)
 */
export async function downloadFromCloud(userId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const [profile, achievements] = await Promise.all([
      fetchCloudProfile(userId),
      fetchCloudAchievements(userId),
    ]);

    if (!profile) {
      return { success: false, error: "No cloud profile found" };
    }

    return {
      success: true,
      profile,
      achievements,
    };
  } catch (error) {
    console.error("Error downloading from cloud:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

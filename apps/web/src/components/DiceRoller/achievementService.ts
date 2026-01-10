/**
 * Achievement Service - Handles persistence of achievements to Supabase
 *
 * Provides both local storage (for offline) and cloud sync (when online).
 */

import type { UserAchievementRow, UserProfileRow } from "@/lib/database.types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { UserProfile } from "./achievements";
import { getAchievementById } from "./achievements";

// ============================================================================
// TYPES
// ============================================================================

export interface SyncResult {
  success: boolean;
  message: string;
  profile?: UserProfileRow;
  achievements?: UserAchievementRow[];
}

export interface UnlockResult {
  success: boolean;
  message: string;
  rewardApplied?: boolean;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Check if cloud sync is available
 */
export function isCloudSyncAvailable(): boolean {
  return isSupabaseConfigured && supabase !== null;
}

/**
 * Fetch user profile from Supabase
 */
export async function fetchUserProfile(
  playerId: string
): Promise<UserProfileRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("player_id", playerId)
    .single();

  if (error) {
    // Not found is okay for new users
    if (error.code === "PGRST116") return null;
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

/**
 * Create or update user profile in Supabase
 */
export async function upsertUserProfile(
  profile: UserProfile
): Promise<UserProfileRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        player_id: profile.playerId,
        display_name: profile.displayName,
        total_score: profile.totalScore,
        total_games_played: profile.totalGamesPlayed,
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
      { onConflict: "player_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting user profile:", error);
    return null;
  }

  return data;
}

/**
 * Fetch user's unlocked achievements from Supabase
 */
export async function fetchUserAchievements(
  playerId: string
): Promise<UserAchievementRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_achievements")
    .select("*")
    .eq("player_id", playerId);

  if (error) {
    console.error("Error fetching user achievements:", error);
    return [];
  }

  return data || [];
}

/**
 * Unlock an achievement in Supabase
 */
export async function unlockAchievementInCloud(
  playerId: string,
  achievementId: string
): Promise<UnlockResult> {
  if (!supabase) {
    return { success: false, message: "Cloud sync not available" };
  }

  const achievement = getAchievementById(achievementId);
  if (!achievement) {
    return { success: false, message: "Achievement not found" };
  }

  // Check if already unlocked
  const { data: existing } = await supabase
    .from("user_achievements")
    .select("id")
    .eq("player_id", playerId)
    .eq("achievement_id", achievementId)
    .single();

  if (existing) {
    return { success: false, message: "Achievement already unlocked" };
  }

  // Insert achievement unlock
  const { error: insertError } = await supabase
    .from("user_achievements")
    .insert({
      player_id: playerId,
      achievement_id: achievementId,
      progress: 100,
    });

  if (insertError) {
    console.error("Error unlocking achievement:", insertError);
    return { success: false, message: "Failed to unlock achievement" };
  }

  // Apply reward to profile
  let rewardApplied = false;
  const { reward } = achievement;

  if (reward.type === "dice_skin" || reward.type === "theme") {
    const column =
      reward.type === "dice_skin" ? "unlocked_skins" : "unlocked_themes";

    const { error: updateError } = await supabase.rpc("array_append_unique", {
      table_name: "user_profiles",
      column_name: column,
      player_id: playerId,
      new_value: reward.value,
    });

    if (!updateError) {
      rewardApplied = true;
    }
  } else if (reward.type === "badge") {
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        equipped_badges: supabase.rpc("array_append", {
          arr: [],
          elem: reward.value,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("player_id", playerId);

    if (!updateError) {
      rewardApplied = true;
    }
  }

  return {
    success: true,
    message: `Achievement "${achievement.name}" unlocked!`,
    rewardApplied,
  };
}

/**
 * Sync multiple achievements to cloud
 */
export async function syncAchievementsToCloud(
  playerId: string,
  achievementIds: string[]
): Promise<{ synced: number; failed: number }> {
  if (!supabase) {
    return { synced: 0, failed: achievementIds.length };
  }

  let synced = 0;
  let failed = 0;

  for (const achievementId of achievementIds) {
    const result = await unlockAchievementInCloud(playerId, achievementId);
    if (result.success) {
      synced++;
    } else {
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Full sync: merge local and cloud data
 * Cloud data takes precedence for conflicts
 */
export async function syncWithCloud(
  playerId: string,
  localProfile: UserProfile,
  localAchievements: Set<string>
): Promise<SyncResult> {
  if (!supabase) {
    return { success: false, message: "Cloud sync not available" };
  }

  try {
    // Fetch cloud data
    const [cloudProfile, cloudAchievements] = await Promise.all([
      fetchUserProfile(playerId),
      fetchUserAchievements(playerId),
    ]);

    // Merge achievements (union of local and cloud)
    const cloudAchievementIds = new Set(
      cloudAchievements.map((a) => a.achievement_id)
    );

    // Find achievements to sync to cloud
    const toSync = [...localAchievements].filter(
      (id) => !cloudAchievementIds.has(id)
    );

    if (toSync.length > 0) {
      await syncAchievementsToCloud(playerId, toSync);
    }

    // Merge profile (take highest values)
    const mergedProfile: UserProfile = cloudProfile
      ? {
          ...localProfile,
          id: cloudProfile.id,
          totalScore: Math.max(
            localProfile.totalScore,
            cloudProfile.total_score
          ),
          totalGamesPlayed: Math.max(
            localProfile.totalGamesPlayed,
            cloudProfile.total_games_played
          ),
          highestScore: Math.max(
            localProfile.highestScore,
            cloudProfile.highest_score
          ),
          highestRound: Math.max(
            localProfile.highestRound,
            cloudProfile.highest_round
          ),
          bestStreak: Math.max(
            localProfile.bestStreak,
            cloudProfile.best_streak
          ),
          unlockedSkins: [
            ...new Set([
              ...localProfile.unlockedSkins,
              ...cloudProfile.unlocked_skins,
            ]),
          ],
          unlockedThemes: [
            ...new Set([
              ...localProfile.unlockedThemes,
              ...cloudProfile.unlocked_themes,
            ]),
          ],
          equippedBadges: [
            ...new Set([
              ...localProfile.equippedBadges,
              ...cloudProfile.equipped_badges,
            ]),
          ],
        }
      : localProfile;

    // Update cloud with merged profile
    const updatedProfile = await upsertUserProfile(mergedProfile);

    // Fetch final achievement list
    const finalAchievements = await fetchUserAchievements(playerId);

    return {
      success: true,
      message: "Sync completed",
      profile: updatedProfile || undefined,
      achievements: finalAchievements,
    };
  } catch (error) {
    console.error("Sync error:", error);
    return { success: false, message: "Sync failed" };
  }
}

/**
 * Record a game session to the cloud
 */
export async function recordGameSession(
  playerId: string,
  sessionId: string,
  score: number,
  roundsSurvived: number,
  rollHistory: number[][],
  achievementsUnlocked: string[]
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from("game_sessions").insert({
    player_id: playerId,
    session_id: sessionId,
    score,
    rounds_survived: roundsSurvived,
    roll_history: rollHistory,
    achievements_unlocked: achievementsUnlocked,
    ended_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error recording game session:", error);
    return false;
  }

  return true;
}

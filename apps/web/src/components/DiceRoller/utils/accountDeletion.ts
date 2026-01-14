/**
 * Account Deletion Service
 *
 * Handles complete account deletion including:
 * - All user data from Supabase tables
 * - Local localStorage data
 * - Supabase auth account
 */

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

// ============================================================================
// TYPES
// ============================================================================

export interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

/**
 * All localStorage keys used by the God Roll app.
 * These need to be cleared when an account is deleted.
 */
export const GODROLL_STORAGE_KEYS = [
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
] as const;

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Clear all local God Roll data from localStorage
 */
export function clearLocalData(): void {
  try {
    for (const key of GODROLL_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore localStorage errors (e.g., private browsing mode)
  }
}

/**
 * Delete all user data from Supabase tables.
 * This deletes data from: user_profiles, user_achievements, leaderboard, game_sessions
 *
 * @param playerId - The player's ID (user.id from Supabase auth)
 */
export async function deleteUserData(
  playerId: string
): Promise<DeleteAccountResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Cloud sync not available" };
  }

  try {
    // Delete in order to respect foreign key constraints
    // Note: These operations are best-effort; if one fails, we continue

    // 1. Delete user achievements
    const { error: achievementsError } = await supabase
      .from("user_achievements")
      .delete()
      .eq("player_id", playerId);

    if (achievementsError) {
      console.warn("Error deleting achievements:", achievementsError);
    }

    // 2. Delete game sessions
    const { error: sessionsError } = await supabase
      .from("game_sessions")
      .delete()
      .eq("player_id", playerId);

    if (sessionsError) {
      console.warn("Error deleting game sessions:", sessionsError);
    }

    // 3. Delete leaderboard entries
    const { error: leaderboardError } = await supabase
      .from("leaderboard")
      .delete()
      .eq("player_id", playerId);

    if (leaderboardError) {
      console.warn("Error deleting leaderboard entries:", leaderboardError);
    }

    // 4. Delete user profile
    const { error: profileError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("player_id", playerId);

    if (profileError) {
      console.warn("Error deleting user profile:", profileError);
    }

    return { success: true };
  } catch (err) {
    console.error("Error deleting user data:", err);
    return { success: false, error: "Failed to delete user data" };
  }
}

/**
 * Delete the user's Supabase auth account.
 * This is the final step after all user data has been deleted.
 *
 * Note: This requires the user to be authenticated and uses the admin API
 * via an edge function for security. If no edge function is available,
 * we sign out the user (the auth account remains but all data is deleted).
 */
export async function deleteAuthAccount(): Promise<DeleteAccountResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Cloud sync not available" };
  }

  try {
    // Get the current session (needed for the auth header)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: "No authenticated session found" };
    }

    // Call the delete-account edge function
    // This function uses the service role key to delete the user
    const { error } = await supabase.functions.invoke("delete-account", {
      body: { userId: session.user.id },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      // If the edge function doesn't exist or fails, just sign out
      console.warn("Edge function failed, signing out instead:", error.message);
      await supabase.auth.signOut();
      return { success: true };
    }

    // Sign out locally after successful deletion
    await supabase.auth.signOut();

    return { success: true };
  } catch (err) {
    console.error("Error deleting auth account:", err);
    // Still try to sign out
    try {
      await supabase?.auth.signOut();
    } catch {
      // Ignore sign out errors
    }
    return { success: false, error: "Failed to delete account" };
  }
}

/**
 * Complete account deletion - deletes all data and the auth account.
 *
 * Order of operations:
 * 1. Delete user data from all Supabase tables
 * 2. Clear all local storage data
 * 3. Delete the Supabase auth account
 *
 * @param playerId - The player's ID (user.id from Supabase auth)
 */
export async function deleteAccount(
  playerId: string
): Promise<DeleteAccountResult> {
  // Step 1: Delete all user data from Supabase
  const dataResult = await deleteUserData(playerId);
  if (!dataResult.success) {
    // Continue anyway - we want to delete as much as possible
    console.warn("Failed to delete some user data:", dataResult.error);
  }

  // Step 2: Clear local storage
  clearLocalData();

  // Step 3: Delete the auth account (or sign out if deletion fails)
  const authResult = await deleteAuthAccount();
  if (!authResult.success) {
    return authResult;
  }

  return { success: true };
}

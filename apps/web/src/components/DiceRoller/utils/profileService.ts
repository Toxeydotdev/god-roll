/**
 * Profile Service - User profile management functions
 *
 * Handles display name validation, availability checking, and profile updates.
 * Separated from achievements since these are core user identity functions.
 */

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

// ============================================================================
// TYPES
// ============================================================================

export interface DisplayNameValidation {
  valid: boolean;
  error?: string;
}

export interface DisplayNameAvailabilityResult {
  available: boolean;
  error?: string;
}

export interface UpdateDisplayNameResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// VALIDATION (pure functions - no side effects)
// ============================================================================

/**
 * Validates display name format (synchronous, no API call)
 * Use this for instant feedback before checking availability
 */
export function validateDisplayNameFormat(
  displayName: string
): DisplayNameValidation {
  const trimmed = displayName.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters" };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: "Name must be 20 characters or less" };
  }

  // Only allow alphanumeric, spaces, dashes, underscores
  const validPattern = /^[a-zA-Z0-9 _-]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      valid: false,
      error: "Only letters, numbers, spaces, dashes, and underscores allowed",
    };
  }

  return { valid: true };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Check if a display name is available in the database
 * Call this after validateDisplayNameFormat passes
 */
export async function checkDisplayNameAvailable(
  displayName: string,
  currentPlayerId?: string
): Promise<DisplayNameAvailabilityResult> {
  if (!isSupabaseConfigured || !supabase) {
    // If Supabase isn't configured, assume available (local-only mode)
    return { available: true };
  }

  const trimmed = displayName.trim();

  // First validate format
  const formatValidation = validateDisplayNameFormat(trimmed);
  if (!formatValidation.valid) {
    return { available: false, error: formatValidation.error };
  }

  try {
    // Check if name exists (excluding current player's own name)
    let query = supabase
      .from("user_profiles")
      .select("player_id")
      .ilike("display_name", trimmed);

    if (currentPlayerId) {
      query = query.neq("player_id", currentPlayerId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      console.error("Error checking display name:", error);
      return { available: false, error: "Failed to check availability" };
    }

    if (data && data.length > 0) {
      return { available: false, error: "This name is already taken" };
    }

    return { available: true };
  } catch (err) {
    console.error("Error checking display name availability:", err);
    return { available: false, error: "Failed to check availability" };
  }
}

/**
 * Update the display name for a player
 */
export async function updateDisplayName(
  playerId: string,
  newDisplayName: string
): Promise<UpdateDisplayNameResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Cloud sync not available" };
  }

  const trimmed = newDisplayName.trim();

  // Validate format first
  const formatValidation = validateDisplayNameFormat(trimmed);
  if (!formatValidation.valid) {
    return { success: false, error: formatValidation.error };
  }

  try {
    const { error } = await supabase
      .from("user_profiles")
      .update({ display_name: trimmed })
      .eq("player_id", playerId);

    if (error) {
      // Check for unique constraint violation
      if (error.code === "23505") {
        return { success: false, error: "This name is already taken" };
      }
      console.error("Error updating display name:", error);
      return { success: false, error: "Failed to update display name" };
    }

    return { success: true };
  } catch (err) {
    console.error("Error updating display name:", err);
    return { success: false, error: "Failed to update display name" };
  }
}

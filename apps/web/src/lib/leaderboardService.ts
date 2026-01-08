import type { LeaderboardEntry } from "./database.types";
import { isSupabaseConfigured, supabase } from "./supabase";

export interface SubmitScoreResult {
  success: boolean;
  rank?: number;
  message: string;
}

/**
 * Check if online features are available
 */
export function isOnlineAvailable(): boolean {
  return isSupabaseConfigured && supabase !== null;
}

/**
 * Fetch top scores from the global leaderboard
 */
export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  if (!supabase) {
    console.warn("Supabase not configured - online leaderboard unavailable");
    return [];
  }

  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }

  return data || [];
}

/**
 * Submit a score to the leaderboard via Edge Function (server-side validation)
 * This prevents cheating by validating the score on the server
 */
export async function submitScore(
  playerName: string,
  score: number,
  roundsSurvived: number,
  sessionId: string
): Promise<SubmitScoreResult> {
  if (!supabase) {
    return { success: false, message: "Online features not configured" };
  }

  try {
    console.log("Submitting score:", {
      playerName,
      score,
      roundsSurvived,
      sessionId,
    });

    const { data, error } = await supabase.functions.invoke("submit-score", {
      body: {
        player_name: playerName,
        score,
        rounds_survived: roundsSurvived,
        session_id: sessionId,
      },
    });

    if (error) {
      console.error("Error submitting score:", error);
      // Try to get more details from the error
      const errorMessage = error.message || "Failed to submit score";
      return { success: false, message: errorMessage };
    }

    console.log("Submit response:", data);
    return data as SubmitScoreResult;
  } catch (err) {
    console.error("Error submitting score:", err);
    return { success: false, message: "Network error" };
  }
}

/**
 * Get a player's rank on the leaderboard
 */
export async function getPlayerRank(score: number): Promise<number> {
  if (!supabase) return -1;

  const { count, error } = await supabase
    .from("leaderboard")
    .select("*", { count: "exact", head: true })
    .gt("score", score);

  if (error) {
    console.error("Error getting player rank:", error);
    return -1;
  }

  return (count || 0) + 1;
}

/**
 * Check if a score qualifies for the leaderboard (top 100)
 */
export async function isHighScore(score: number): Promise<boolean> {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("leaderboard")
    .select("score")
    .order("score", { ascending: true })
    .limit(1);

  if (error) {
    console.error("Error checking high score:", error);
    return true; // Assume it's a high score if we can't check
  }

  // If less than 100 entries, any score qualifies
  const { count } = await supabase
    .from("leaderboard")
    .select("*", { count: "exact", head: true });

  if ((count || 0) < 100) return true;

  // Otherwise, check if score beats the lowest
  const scores = data as { score: number }[] | null;
  return !scores || scores.length === 0 || score > scores[0].score;
}

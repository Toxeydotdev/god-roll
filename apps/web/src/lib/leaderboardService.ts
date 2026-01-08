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
 * Generate HMAC-SHA256 signature for score submission
 */
async function generateHmacSignature(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  // Import the secret key
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Sign the payload
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);

  // Convert to hex string
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = signatureArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature;
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
    // Get the signing secret from environment variable
    const signingSecret = import.meta.env.VITE_SCORE_SIGNING_SECRET;
    if (!signingSecret) {
      console.error("VITE_SCORE_SIGNING_SECRET not configured");
      return { success: false, message: "Client configuration error" };
    }

    // Add timestamp for replay attack prevention
    const timestamp = Date.now();

    // Create the payload
    const payload = {
      player_name: playerName,
      score,
      rounds_survived: roundsSurvived,
      session_id: sessionId,
      timestamp,
    };

    const bodyText = JSON.stringify(payload);

    // Generate HMAC signature
    const signature = await generateHmacSignature(bodyText, signingSecret);

    console.log("Submitting score:", payload);

    // Call the Edge Function with signature
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/submit-score`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabase.supabaseKey}`,
          "X-Score-Signature": signature,
        },
        body: bodyText,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Error submitting score:", data);
      return {
        success: false,
        message: data.message || "Failed to submit score",
      };
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

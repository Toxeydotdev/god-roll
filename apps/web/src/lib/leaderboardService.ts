import type { LeaderboardEntry } from "./database.types";
import { isSupabaseConfigured, supabase } from "./supabase";

export interface SubmitScoreResult {
  success: boolean;
  rank?: number;
  message: string;
}

export interface SubmitScoreParams {
  playerId: string;
  playerName: string;
  score: number;
  roundsSurvived: number;
  sessionId: string;
}

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

/**
 * Retry a function with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: unknown) => boolean,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 10000 } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this isn't a retryable error
      if (!shouldRetry(error)) {
        throw error;
      }

      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const delay = Math.min(
          baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelayMs
        );
        console.log(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(
            delay
          )}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Check if an error is retryable (network issues, 5xx errors, 401/403 that might be transient)
 */
function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  // Network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }

  // Check for HTTP status codes in error object
  const errorObj = error as {
    status?: number;
    code?: string;
    message?: string;
  };

  // Retry on 5xx server errors
  if (errorObj.status && errorObj.status >= 500) {
    return true;
  }

  // Retry on 401/403 (might be transient auth issues)
  if (errorObj.status === 401 || errorObj.status === 403) {
    return true;
  }

  // Retry on rate limiting
  if (errorObj.status === 429) {
    return true;
  }

  // Retry on network-related error messages
  if (
    errorObj.message &&
    (errorObj.message.includes("network") ||
      errorObj.message.includes("timeout") ||
      errorObj.message.includes("ECONNRESET") ||
      errorObj.message.includes("fetch"))
  ) {
    return true;
  }

  return false;
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
 * Requires authentication - only logged-in users can submit scores
 * Includes retry logic with exponential backoff for transient failures
 */
export async function submitScore(
  params: SubmitScoreParams,
  retryOptions?: RetryOptions
): Promise<SubmitScoreResult> {
  if (!supabase) {
    return { success: false, message: "Online features not configured" };
  }

  const { playerId, playerName, score, roundsSurvived, sessionId } = params;

  // Validate player ID is present (must be authenticated)
  if (!playerId) {
    return {
      success: false,
      message: "You must be logged in to submit scores",
    };
  }

  const invokeSubmit = async (): Promise<SubmitScoreResult> => {
    console.log("Submitting score:", {
      playerId,
      playerName,
      score,
      roundsSurvived,
      sessionId,
    });

    // Get the current session to pass the auth token explicitly
    const {
      data: { session },
    } = await supabase!.auth.getSession();

    if (!session?.access_token) {
      throw new Error("No active session - please sign in again");
    }

    const { data, error } = await supabase!.functions.invoke("submit-score", {
      body: {
        player_id: playerId,
        player_name: playerName,
        score,
        rounds_survived: roundsSurvived,
        session_id: sessionId,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error("Error submitting score:", error);
      // Throw to trigger retry logic
      throw error;
    }

    console.log("Submit response:", data);
    return data as SubmitScoreResult;
  };

  try {
    return await withRetry(invokeSubmit, isRetryableError, {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 8000,
      ...retryOptions,
    });
  } catch (err) {
    console.error("Error submitting score after retries:", err);
    const errorObj = err as { message?: string; status?: number };

    // Provide more specific error messages
    let message = "Network error";
    if (errorObj.status === 401) {
      message = "Authentication error - please try signing out and back in";
    } else if (errorObj.status === 403) {
      message = "Permission denied";
    } else if (errorObj.status === 429) {
      message = "Too many requests - please wait a moment";
    } else if (errorObj.message) {
      message = errorObj.message;
    }

    return { success: false, message };
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

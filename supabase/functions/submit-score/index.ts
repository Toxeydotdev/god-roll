// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================
// HMAC SIGNATURE VERIFICATION
// ============================================

// Must match client-side key exactly
const SIGNING_KEY_PARTS = [
  "gR0ll", // App identifier
  "v1", // Version
  "2026", // Year
  "s3cr3t", // Base secret
];

/**
 * Get the signing key for HMAC verification
 */
async function getSigningKey(): Promise<CryptoKey> {
  const keyMaterial = SIGNING_KEY_PARTS.join("-");
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);

  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

/**
 * Convert hex string to ArrayBuffer
 */
function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Create canonical string for verification (must match client-side exactly)
 */
function createCanonicalString(data: {
  player_id: string;
  score: number;
  rounds_survived: number;
  session_id: string;
  timestamp: number;
}): string {
  return [
    `pid:${data.player_id}`,
    `sc:${data.score}`,
    `rnd:${data.rounds_survived}`,
    `sid:${data.session_id}`,
    `ts:${data.timestamp}`,
  ].join("|");
}

/**
 * Verify HMAC signature
 */
async function verifySignature(
  data: {
    player_id: string;
    score: number;
    rounds_survived: number;
    session_id: string;
    timestamp: number;
  },
  signature: string
): Promise<boolean> {
  try {
    const key = await getSigningKey();
    const canonicalString = createCanonicalString(data);
    const encoder = new TextEncoder();
    const messageData = encoder.encode(canonicalString);
    const signatureBuffer = hexToBuffer(signature);

    return crypto.subtle.verify("HMAC", key, signatureBuffer, messageData);
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Check if timestamp is within acceptable range (5 minutes)
 */
function isTimestampValid(timestamp: number): boolean {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  return Math.abs(now - timestamp) <= maxAge;
}

// ============================================
// TYPES
// ============================================

interface ScoreSubmission {
  player_id: string;
  player_name: string;
  score: number;
  rounds_survived: number;
  session_id: string;
  timestamp: number;
  signature: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, message: "Method not allowed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      }
    );
  }

  try {
    // ========================================
    // AUTHENTICATION - Verify JWT manually
    // ========================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing authorization" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create a client with the anon key to verify the user's JWT
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verify the JWT and get the user
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ success: false, message: "Invalid or expired token" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    console.log("Authenticated user:", user.id);

    // Service role client for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify we have a service role key
    if (!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      console.error("SUPABASE_SERVICE_ROLE_KEY not configured");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Server configuration error",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const {
      player_id,
      player_name,
      score,
      rounds_survived,
      session_id,
      timestamp,
      signature,
    }: ScoreSubmission = await req.json();

    // ========================================
    // HMAC SIGNATURE VERIFICATION (Anti-tampering)
    // ========================================

    // Verify timestamp is recent (prevents replay attacks)
    if (!timestamp || !isTimestampValid(timestamp)) {
      console.error("Invalid or expired timestamp:", timestamp);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Request expired - please try again",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Verify HMAC signature
    if (!signature) {
      console.error("Missing signature");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid request signature",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const isValidSignature = await verifySignature(
      { player_id, score, rounds_survived, session_id, timestamp },
      signature
    );

    if (!isValidSignature) {
      console.error("Invalid signature for submission:", {
        player_id,
        score,
        timestamp,
      });
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid request signature",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Verify the player_id matches the authenticated user
    if (player_id !== user.id) {
      console.error("Player ID mismatch:", { player_id, userId: user.id });
      return new Response(
        JSON.stringify({ success: false, message: "Player ID mismatch" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // ========================================
    // VALIDATION RULES (Anti-cheat)
    // ========================================

    // 1. Basic validation
    if (!player_id || !player_name || typeof score !== "number" || score < 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid score data - player_id and player_name required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // 2. Player name validation (2-20 chars, alphanumeric + spaces, dashes, underscores)
    const nameRegex = /^[a-zA-Z0-9 _-]{2,20}$/;
    if (!nameRegex.test(player_name)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid player name" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // 3. Score sanity check (max possible score per round logic)
    // In God Roll: max dice roll per round = rounds * 6
    // Total score can't exceed sum of max possible rolls
    const maxPossibleScore =
      ((rounds_survived * (rounds_survived + 1)) / 2) * 6;
    if (score > maxPossibleScore) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Score exceeds maximum possible",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // 4. Check for duplicate session (prevent replay attacks)
    if (session_id) {
      const { data: existingSession } = await supabaseClient
        .from("leaderboard")
        .select("id")
        .eq("session_id", session_id)
        .single();

      if (existingSession) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Score already submitted for this session",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
    }

    // ========================================
    // INSERT SCORE
    // ========================================

    const { error: insertError } = await supabaseClient
      .from("leaderboard")
      .insert({
        player_id,
        player_name,
        score,
        rounds_survived,
        session_id,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to save score",
          error: insertError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Get the player's rank
    const { count } = await supabaseClient
      .from("leaderboard")
      .select("*", { count: "exact", head: true })
      .gt("score", score);

    const rank = (count || 0) + 1;

    return new Response(
      JSON.stringify({
        success: true,
        rank,
        message: `Score submitted! You ranked #${rank}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

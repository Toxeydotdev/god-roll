// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-score-signature",
};

interface ScoreSubmission {
  player_name: string;
  score: number;
  rounds_survived: number;
  session_id: string;
  timestamp: number;
}

// ========================================
// RATE LIMITING
// ========================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit storage (per IP)
const rateLimitMap = new Map<string, RateLimitEntry>();

// Rate limit: 5 requests per minute per IP
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  
  // Cleanup old entries on-demand to prevent memory leaks
  // Limit cleanup to max 10 entries per check for performance
  let cleanedCount = 0;
  const maxCleanupPerCheck = 10;
  for (const [key, entry] of rateLimitMap.entries()) {
    if (cleanedCount >= maxCleanupPerCheck) break;
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
      cleanedCount++;
    }
  }
  
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    // First request or window expired - create new entry
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_REQUESTS) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  entry.count++;
  return { allowed: true };
}

// ========================================
// HMAC SIGNATURE VERIFICATION
// ========================================

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

async function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
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
    const computedSignature = signatureArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison to prevent timing attacks
    return constantTimeCompare(computedSignature, signature.toLowerCase());
  } catch (error) {
    console.error("HMAC verification error:", error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ========================================
    // RATE LIMITING
    // ========================================

    // Extract client IP with validation
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    
    let clientIp = "unknown";
    if (forwardedFor) {
      // Take first IP from x-forwarded-for (most trusted)
      const ips = forwardedFor.split(",");
      clientIp = ips[0].trim();
    } else if (realIp) {
      clientIp = realIp.trim();
    }
    
    // Basic IP format validation (IPv4 or IPv6)
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    
    if (clientIp !== "unknown" && !ipv4Regex.test(clientIp) && !ipv6Regex.test(clientIp)) {
      console.warn(`Invalid IP format from headers: ${clientIp}`);
      clientIp = "unknown";
    }

    const rateLimitResult = checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      console.warn(
        `Rate limit exceeded for IP: ${clientIp}, retry after ${rateLimitResult.retryAfter}s`
      );
      return new Response(
        JSON.stringify({
          success: false,
          message: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfter),
          },
          status: 429,
        }
      );
    }

    // ========================================
    // HMAC SIGNATURE VERIFICATION
    // ========================================

    const scoringSecret = Deno.env.get("SCORE_SIGNING_SECRET");
    if (!scoringSecret) {
      console.error("SCORE_SIGNING_SECRET environment variable not set");
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

    const signature = req.headers.get("x-score-signature");
    if (!signature) {
      console.warn(`Missing signature from IP: ${clientIp}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing signature - request rejected",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const bodyText = await req.text();
    const body = JSON.parse(bodyText) as ScoreSubmission;

    // Verify signature
    const isValidSignature = await verifyHmacSignature(
      bodyText,
      signature,
      scoringSecret
    );

    if (!isValidSignature) {
      console.warn(`Invalid signature from IP: ${clientIp}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid signature - request rejected",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // ========================================
    // TIMESTAMP VALIDATION (Replay Attack Prevention)
    // ========================================

    const { timestamp } = body;
    if (!timestamp || typeof timestamp !== "number") {
      console.warn(`Missing or invalid timestamp from IP: ${clientIp}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing or invalid timestamp",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const now = Date.now();
    const timeDiff = now - timestamp;
    const MAX_TIME_DIFF = 5 * 60 * 1000; // 5 minutes

    // Reject if timestamp is too old or in the future
    if (timeDiff < 0 || timeDiff > MAX_TIME_DIFF) {
      console.warn(
        `Invalid timestamp from IP: ${clientIp}, diff: ${timeDiff}ms`
      );
      return new Response(
        JSON.stringify({
          success: false,
          message: "Request timestamp expired or invalid - please try again",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { player_name, score, rounds_survived, session_id } = body;

    // ========================================
    // VALIDATION RULES (Anti-cheat)
    // ========================================

    // 1. Basic validation
    if (!player_name || typeof score !== "number" || score < 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid score data" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // 2. Player name validation (3-20 chars, alphanumeric + spaces)
    const nameRegex = /^[a-zA-Z0-9 ]{3,20}$/;
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
        player_name,
        score,
        rounds_survived,
        session_id,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to save score" }),
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

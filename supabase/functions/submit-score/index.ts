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
};

interface ScoreSubmission {
  player_name: string;
  score: number;
  rounds_survived: number;
  session_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { player_name, score, rounds_survived, session_id }: ScoreSubmission =
      await req.json();

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

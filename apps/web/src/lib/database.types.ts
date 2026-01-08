export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      leaderboard: {
        Row: {
          id: string;
          player_name: string;
          score: number;
          rounds_survived: number;
          created_at: string;
          session_id: string | null;
        };
        Insert: {
          id?: string;
          player_name: string;
          score: number;
          rounds_survived: number;
          created_at?: string;
          session_id?: string | null;
        };
        Update: {
          id?: string;
          player_name?: string;
          score?: number;
          rounds_survived?: number;
          created_at?: string;
          session_id?: string | null;
        };
      };
      player_rewards: {
        Row: {
          id: string;
          player_id: string;
          reward_type: string;
          reward_data: Json;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          reward_type: string;
          reward_data?: Json;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          reward_type?: string;
          reward_data?: Json;
          unlocked_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      submit_score: {
        Args: {
          p_player_name: string;
          p_score: number;
          p_rounds_survived: number;
          p_session_id: string;
        };
        Returns: {
          success: boolean;
          rank: number;
          message: string;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type LeaderboardEntry =
  Database["public"]["Tables"]["leaderboard"]["Row"];
export type LeaderboardInsert =
  Database["public"]["Tables"]["leaderboard"]["Insert"];
export type PlayerReward =
  Database["public"]["Tables"]["player_rewards"]["Row"];

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
          player_id: string;
          player_name: string;
          score: number;
          rounds_survived: number;
          created_at: string;
          session_id: string | null;
        };
        Insert: {
          id?: string;
          player_id: string;
          player_name: string;
          score: number;
          rounds_survived: number;
          created_at?: string;
          session_id?: string | null;
        };
        Update: {
          id?: string;
          player_id?: string;
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
      user_profiles: {
        Row: {
          id: string;
          player_id: string;
          display_name: string;
          total_score: number;
          total_games_played: number;
          highest_score: number;
          highest_round: number;
          current_streak: number;
          best_streak: number;
          last_played_at: string;
          consecutive_days: number;
          unlocked_skins: string[];
          unlocked_themes: string[];
          equipped_badges: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          display_name?: string;
          total_score?: number;
          total_games_played?: number;
          highest_score?: number;
          highest_round?: number;
          current_streak?: number;
          best_streak?: number;
          last_played_at?: string;
          consecutive_days?: number;
          unlocked_skins?: string[];
          unlocked_themes?: string[];
          equipped_badges?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          display_name?: string;
          total_score?: number;
          total_games_played?: number;
          highest_score?: number;
          highest_round?: number;
          current_streak?: number;
          best_streak?: number;
          last_played_at?: string;
          consecutive_days?: number;
          unlocked_skins?: string[];
          unlocked_themes?: string[];
          equipped_badges?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          player_id: string;
          achievement_id: string;
          unlocked_at: string;
          progress: number;
        };
        Insert: {
          id?: string;
          player_id: string;
          achievement_id: string;
          unlocked_at?: string;
          progress?: number;
        };
        Update: {
          id?: string;
          player_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
          progress?: number;
        };
      };
      achievement_definitions: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: string;
          icon: string;
          reward_type: string;
          reward_value: string;
          reward_display_name: string;
          hidden: boolean;
          requirement_type: string;
          requirement_data: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          category: string;
          icon: string;
          reward_type: string;
          reward_value: string;
          reward_display_name: string;
          hidden?: boolean;
          requirement_type: string;
          requirement_data?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          category?: string;
          icon?: string;
          reward_type?: string;
          reward_value?: string;
          reward_display_name?: string;
          hidden?: boolean;
          requirement_type?: string;
          requirement_data?: Json;
          created_at?: string;
        };
      };
      game_sessions: {
        Row: {
          id: string;
          player_id: string;
          session_id: string;
          score: number;
          rounds_survived: number;
          roll_history: Json;
          achievements_unlocked: string[];
          started_at: string;
          ended_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          session_id: string;
          score: number;
          rounds_survived: number;
          roll_history?: Json;
          achievements_unlocked?: string[];
          started_at?: string;
          ended_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          session_id?: string;
          score?: number;
          rounds_survived?: number;
          roll_history?: Json;
          achievements_unlocked?: string[];
          started_at?: string;
          ended_at?: string;
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
export type UserProfileRow =
  Database["public"]["Tables"]["user_profiles"]["Row"];
export type UserAchievementRow =
  Database["public"]["Tables"]["user_achievements"]["Row"];
export type AchievementDefinitionRow =
  Database["public"]["Tables"]["achievement_definitions"]["Row"];
export type GameSessionRow =
  Database["public"]["Tables"]["game_sessions"]["Row"];

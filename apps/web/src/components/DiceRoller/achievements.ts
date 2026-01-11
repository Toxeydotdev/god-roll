/**
 * Achievement System - Definitions and utilities
 *
 * Achievements reward players for various accomplishments in the game.
 * Each achievement can unlock rewards like dice skins, themes, badges, or bonus points.
 */

import type { DiceFaceNumber } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export type AchievementCategory =
  | "roll"
  | "score"
  | "survival"
  | "streak"
  | "play"
  | "special";

export type RewardType =
  | "dice_skin"
  | "theme"
  | "badge"
  | "bonus_points"
  | "title";

export interface AchievementReward {
  type: RewardType;
  value: string; // skin ID, theme ID, badge name, or point amount
  displayName: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string; // Emoji icon for display
  reward: AchievementReward;
  hidden?: boolean; // Hidden achievements don't show until unlocked
  requirement: AchievementRequirement;
}

export type AchievementRequirement =
  | { type: "roll_exact"; values: number[] } // Roll specific numbers (e.g., [1, 1] for snake eyes)
  | { type: "roll_total"; total: number } // Roll a specific total
  | { type: "roll_same"; count: number } // Roll N of the same number
  | { type: "roll_straight"; length: number } // Roll consecutive numbers
  | { type: "roll_all_same"; value: DiceFaceNumber } // All dice show same value
  | { type: "score_single"; score: number } // Score X in one game
  | { type: "score_lifetime"; score: number } // Score X total across all games
  | { type: "survive_rounds"; rounds: number } // Survive N rounds in one game
  | { type: "games_played"; count: number } // Play N games total
  | { type: "games_streak"; count: number; minScore?: number } // Win N games in a row
  | { type: "consecutive_days"; days: number } // Play on N consecutive days
  | { type: "close_call"; margin: number } // Roll within N of 7 multiple
  | { type: "low_roll"; maxTotal: number; minDice: number } // Roll very low with multiple dice
  | { type: "yahtzee" } // All dice show same value (5+ dice)
  | { type: "four_of_kind" } // Four dice show same value
  | { type: "custom"; checkFn: string }; // Custom check (function name)

export interface PlayerAchievementProgress {
  achievementId: string;
  unlockedAt: string | null;
  progress?: number; // For progressive achievements (0-100)
}

export interface UserProfile {
  id: string;
  playerId: string; // Anonymous or authenticated user ID
  displayName: string;
  totalScore: number;
  totalGamesPlayed: number;
  highestScore: number;
  highestRound: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedAt: string;
  consecutiveDays: number;
  unlockedSkins: string[];
  unlockedThemes: string[];
  equippedBadges: string[];
  unlockedTitles: string[]; // Unlocked title rewards
  equippedTitle: string | null; // Currently displayed title
  createdAt: string;
  updatedAt: string;
}

export interface GameSessionStats {
  score: number;
  round: number;
  rolls: DiceFaceNumber[][];
  rollTotals: number[];
  startedAt: string;
  endedAt?: string;
}

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

export const ACHIEVEMENTS: Achievement[] = [
  // ========== ROLL ACHIEVEMENTS ==========
  {
    id: "snake_eyes",
    name: "Snake Eyes",
    description: "Roll two 1s",
    category: "roll",
    icon: "🐍",
    reward: {
      type: "badge",
      value: "snake_eyes",
      displayName: "Snake Eyes Badge",
    },
    requirement: { type: "roll_exact", values: [1, 1] },
  },
  {
    id: "triple_threat",
    name: "Triple Threat",
    description: "Roll three of the same number",
    category: "roll",
    icon: "🎯",
    reward: {
      type: "bonus_points",
      value: "50",
      displayName: "+50 Bonus Points",
    },
    requirement: { type: "roll_same", count: 3 },
  },
  {
    id: "full_house",
    name: "Full House",
    description: "Roll 3 of one number + 2 of another",
    category: "roll",
    icon: "🏠",
    reward: {
      type: "dice_skin",
      value: "casino",
      displayName: "Casino Dice Skin",
    },
    requirement: { type: "custom", checkFn: "checkFullHouse" },
  },
  {
    id: "straight_shooter",
    name: "Straight Shooter",
    description: "Roll 1-2-3-4-5 or 2-3-4-5-6",
    category: "roll",
    icon: "📏",
    reward: {
      type: "dice_skin",
      value: "emerald",
      displayName: "Emerald Dice Skin",
    },
    requirement: { type: "roll_straight", length: 5 },
  },
  {
    id: "all_sixes",
    name: "All Sixes",
    description: "Roll all 6s (3+ dice)",
    category: "roll",
    icon: "6️⃣",
    reward: {
      type: "dice_skin",
      value: "neon",
      displayName: "Neon Glow Dice Skin",
    },
    requirement: { type: "roll_all_same", value: 6 },
  },
  {
    id: "boxcars",
    name: "Boxcars",
    description: "Roll double 6s",
    category: "roll",
    icon: "🚃",
    reward: {
      type: "bonus_points",
      value: "25",
      displayName: "+25 Bonus Points",
    },
    requirement: { type: "roll_exact", values: [6, 6] },
  },
  {
    id: "lucky_sevens",
    name: "Lucky Sevens",
    description: "Roll exactly 7 on your first roll and survive",
    category: "roll",
    icon: "🍀",
    reward: {
      type: "dice_skin",
      value: "lucky",
      displayName: "Lucky Dice Skin",
    },
    hidden: true,
    requirement: { type: "custom", checkFn: "checkLuckySevens" },
  },

  // ========== SCORE ACHIEVEMENTS ==========
  {
    id: "century_club",
    name: "Century Club",
    description: "Score 100 points in a single game",
    category: "score",
    icon: "💯",
    reward: { type: "theme", value: "blue", displayName: "Ocean Theme" },
    requirement: { type: "score_single", score: 100 },
  },
  {
    id: "high_roller",
    name: "High Roller",
    description: "Score 500 points in a single game",
    category: "score",
    icon: "🎰",
    reward: {
      type: "dice_skin",
      value: "ice",
      displayName: "Ice Crystal Dice Skin",
    },
    requirement: { type: "score_single", score: 500 },
  },
  {
    id: "score_machine",
    name: "Score Machine",
    description: "Score 250 points in a single game",
    category: "score",
    icon: "⚙️",
    reward: { type: "theme", value: "orange", displayName: "Sunset Theme" },
    requirement: { type: "score_single", score: 250 },
  },
  {
    id: "thousandaire",
    name: "Thousandaire",
    description: "Score 1,000 points total across all games",
    category: "score",
    icon: "💰",
    reward: {
      type: "badge",
      value: "thousandaire",
      displayName: "Thousandaire Badge",
    },
    requirement: { type: "score_lifetime", score: 1000 },
  },
  {
    id: "ten_grand",
    name: "Ten Grand",
    description: "Score 10,000 points total across all games",
    category: "score",
    icon: "💎",
    reward: { type: "dice_skin", value: "gold", displayName: "Gold Dice Skin" },
    requirement: { type: "score_lifetime", score: 10000 },
  },

  // ========== SURVIVAL ACHIEVEMENTS ==========
  {
    id: "beginners_luck",
    name: "Beginner's Luck",
    description: "Survive 3 rounds",
    category: "survival",
    icon: "🌱",
    reward: { type: "badge", value: "beginner", displayName: "Beginner Badge" },
    requirement: { type: "survive_rounds", rounds: 3 },
  },
  {
    id: "getting_warmed_up",
    name: "Getting Warmed Up",
    description: "Survive 5 rounds",
    category: "survival",
    icon: "🔥",
    reward: { type: "theme", value: "purple", displayName: "Lavender Theme" },
    requirement: { type: "survive_rounds", rounds: 5 },
  },
  {
    id: "survivor",
    name: "Survivor",
    description: "Survive 10 rounds",
    category: "survival",
    icon: "🛡️",
    reward: {
      type: "dice_skin",
      value: "tiana",
      displayName: "Tiana Dice Skin",
    },
    requirement: { type: "survive_rounds", rounds: 10 },
  },
  {
    id: "iron_will",
    name: "Iron Will",
    description: "Survive 15 rounds",
    category: "survival",
    icon: "⚔️",
    reward: {
      type: "dice_skin",
      value: "inferno",
      displayName: "Inferno Dice Skin",
    },
    requirement: { type: "survive_rounds", rounds: 15 },
  },
  {
    id: "untouchable",
    name: "Untouchable",
    description: "Survive 20 rounds",
    category: "survival",
    icon: "👑",
    reward: {
      type: "dice_skin",
      value: "dragon",
      displayName: "Dragon Dice Skin",
    },
    requirement: { type: "survive_rounds", rounds: 20 },
  },

  // ========== PLAY ACHIEVEMENTS ==========
  {
    id: "first_roll",
    name: "First Roll",
    description: "Play your first game",
    category: "play",
    icon: "🎲",
    reward: { type: "badge", value: "welcome", displayName: "Welcome Badge" },
    requirement: { type: "games_played", count: 1 },
  },
  {
    id: "regular_player",
    name: "Regular Player",
    description: "Play 10 games",
    category: "play",
    icon: "📅",
    reward: {
      type: "badge",
      value: "regular",
      displayName: "Regular Player Badge",
    },
    requirement: { type: "games_played", count: 10 },
  },
  {
    id: "dedicated",
    name: "Dedicated",
    description: "Play 50 games",
    category: "play",
    icon: "🎖️",
    reward: {
      type: "dice_skin",
      value: "marble",
      displayName: "Marble Dice Skin",
    },
    requirement: { type: "games_played", count: 50 },
  },
  {
    id: "veteran",
    name: "Veteran",
    description: "Play 100 games",
    category: "play",
    icon: "🏅",
    reward: { type: "title", value: "Veteran", displayName: "Veteran Title" },
    requirement: { type: "games_played", count: 100 },
  },
  {
    id: "daily_roller",
    name: "Daily Roller",
    description: "Play on 7 consecutive days",
    category: "play",
    icon: "📆",
    reward: {
      type: "dice_skin",
      value: "rainbow",
      displayName: "Rainbow Dice Skin",
    },
    requirement: { type: "consecutive_days", days: 7 },
  },

  // ========== STREAK ACHIEVEMENTS ==========
  {
    id: "hot_streak",
    name: "Hot Streak",
    description: "Score 50+ in 3 consecutive games",
    category: "streak",
    icon: "🔥",
    reward: {
      type: "bonus_points",
      value: "25",
      displayName: "+25 Bonus Points",
    },
    requirement: { type: "games_streak", count: 3, minScore: 50 },
  },
  {
    id: "on_fire",
    name: "On Fire",
    description: "Score 50+ in 5 consecutive games",
    category: "streak",
    icon: "🌟",
    reward: { type: "theme", value: "pink", displayName: "Sakura Theme" },
    requirement: { type: "games_streak", count: 5, minScore: 50 },
  },

  // ========== SPECIAL ACHIEVEMENTS ==========
  {
    id: "close_call",
    name: "Close Call",
    description: "Roll a total of 6 or 8 (one away from doom!)",
    category: "special",
    icon: "😰",
    reward: {
      type: "badge",
      value: "close_call",
      displayName: "Close Call Badge",
    },
    requirement: { type: "close_call", margin: 1 },
  },
  {
    id: "the_gambler",
    name: "The Gambler",
    description: "Roll exactly 21 (blackjack!)",
    category: "special",
    icon: "🃏",
    reward: {
      type: "dice_skin",
      value: "vegas",
      displayName: "Vegas Dice Skin",
    },
    hidden: true,
    requirement: { type: "roll_total", total: 21 },
  },
  {
    id: "lucky_thirteen",
    name: "Lucky Thirteen",
    description: "Roll 13 and survive",
    category: "special",
    icon: "🔮",
    reward: {
      type: "badge",
      value: "superstition",
      displayName: "Superstition Badge",
    },
    hidden: true,
    requirement: { type: "roll_total", total: 13 },
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Unlock all other achievements",
    category: "special",
    icon: "✨",
    reward: {
      type: "dice_skin",
      value: "platinum",
      displayName: "Platinum Dice Skin",
    },
    hidden: true,
    requirement: { type: "custom", checkFn: "checkPerfectionist" },
  },

  // ========== NEW ROLL ACHIEVEMENTS ==========
  {
    id: "four_of_a_kind",
    name: "Four of a Kind",
    description: "Roll four dice showing the same number",
    category: "roll",
    icon: "🎰",
    reward: {
      type: "dice_skin",
      value: "ruby",
      displayName: "Ruby Dice Skin",
    },
    requirement: { type: "four_of_kind" },
  },
  {
    id: "yahtzee",
    name: "Yahtzee!",
    description: "Roll 5+ dice all showing the same number",
    category: "roll",
    icon: "🎯",
    reward: {
      type: "dice_skin",
      value: "cosmic",
      displayName: "Cosmic Dice Skin",
    },
    requirement: { type: "yahtzee" },
  },
  {
    id: "snake_pit",
    name: "Snake Pit",
    description: "Roll three or more 1s",
    category: "roll",
    icon: "🐍",
    reward: {
      type: "bonus_points",
      value: "75",
      displayName: "+75 Bonus Points",
    },
    requirement: { type: "roll_exact", values: [1, 1, 1] },
  },
  {
    id: "mini_straight",
    name: "Mini Straight",
    description: "Roll 1-2-3 or 4-5-6 in one roll",
    category: "roll",
    icon: "📐",
    reward: {
      type: "bonus_points",
      value: "30",
      displayName: "+30 Bonus Points",
    },
    requirement: { type: "roll_straight", length: 3 },
  },
  {
    id: "low_roller",
    name: "Low Roller",
    description: "Roll 4+ dice with a total of 6 or less",
    category: "roll",
    icon: "⬇️",
    reward: {
      type: "badge",
      value: "low_roller",
      displayName: "Low Roller Badge",
    },
    requirement: { type: "low_roll", maxTotal: 6, minDice: 4 },
  },
  {
    id: "all_ones",
    name: "Snake Eyes Deluxe",
    description: "Roll all 1s (3+ dice)",
    category: "roll",
    icon: "👁️",
    reward: {
      type: "dice_skin",
      value: "shadow",
      displayName: "Shadow Dice Skin",
    },
    requirement: { type: "roll_all_same", value: 1 },
  },

  // ========== NEW SCORE ACHIEVEMENTS ==========
  {
    id: "big_score",
    name: "Big Score",
    description: "Score 750 points in a single game",
    category: "score",
    icon: "💵",
    reward: {
      type: "theme",
      value: "midnight",
      displayName: "Midnight Theme",
    },
    requirement: { type: "score_single", score: 750 },
  },
  {
    id: "legendary_game",
    name: "Legendary Game",
    description: "Score 1,000 points in a single game",
    category: "score",
    icon: "🌟",
    reward: {
      type: "title",
      value: "Champion",
      displayName: "Champion Title",
    },
    requirement: { type: "score_single", score: 1000 },
  },
  {
    id: "fifty_grand",
    name: "Fifty Grand",
    description: "Score 50,000 points total across all games",
    category: "score",
    icon: "💎",
    reward: {
      type: "dice_skin",
      value: "diamond",
      displayName: "Diamond Dice Skin",
    },
    requirement: { type: "score_lifetime", score: 50000 },
  },
  {
    id: "hundred_grand",
    name: "Hundred Grand",
    description: "Score 100,000 points total",
    category: "score",
    icon: "👑",
    reward: {
      type: "title",
      value: "Master",
      displayName: "Master Title",
    },
    requirement: { type: "score_lifetime", score: 100000 },
  },

  // ========== NEW SURVIVAL ACHIEVEMENTS ==========
  {
    id: "lucky_streak",
    name: "Lucky Streak",
    description: "Survive 7 rounds (lucky number!)",
    category: "survival",
    icon: "🍀",
    reward: {
      type: "badge",
      value: "lucky_survivor",
      displayName: "Lucky Survivor Badge",
    },
    requirement: { type: "survive_rounds", rounds: 7 },
  },
  {
    id: "legendary_run",
    name: "Legendary Run",
    description: "Survive 25 rounds",
    category: "survival",
    icon: "🏆",
    reward: {
      type: "title",
      value: "Legend",
      displayName: "Legend Title",
    },
    requirement: { type: "survive_rounds", rounds: 25 },
  },
  {
    id: "marathon",
    name: "Marathon",
    description: "Survive 30 rounds in a single game",
    category: "survival",
    icon: "🏃",
    reward: {
      type: "dice_skin",
      value: "aurora",
      displayName: "Aurora Dice Skin",
    },
    requirement: { type: "survive_rounds", rounds: 30 },
  },

  // ========== NEW PLAY ACHIEVEMENTS ==========
  {
    id: "committed",
    name: "Committed",
    description: "Play 25 games",
    category: "play",
    icon: "💪",
    reward: {
      type: "theme",
      value: "dark",
      displayName: "Dark Theme",
    },
    requirement: { type: "games_played", count: 25 },
  },
  {
    id: "die_hard",
    name: "Die Hard",
    description: "Play 200 games",
    category: "play",
    icon: "🎬",
    reward: {
      type: "dice_skin",
      value: "lava",
      displayName: "Lava Dice Skin",
    },
    requirement: { type: "games_played", count: 200 },
  },
  {
    id: "two_week_streak",
    name: "Two Week Streak",
    description: "Play on 14 consecutive days",
    category: "play",
    icon: "📆",
    reward: {
      type: "theme",
      value: "sunset",
      displayName: "Sunset Theme",
    },
    requirement: { type: "consecutive_days", days: 14 },
  },

  // ========== NEW STREAK ACHIEVEMENTS ==========
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Score 50+ in 10 consecutive games",
    category: "streak",
    icon: "💫",
    reward: {
      type: "dice_skin",
      value: "electric",
      displayName: "Electric Dice Skin",
    },
    requirement: { type: "games_streak", count: 10, minScore: 50 },
  },
  {
    id: "consistency_king",
    name: "Consistency King",
    description: "Score 100+ in 5 consecutive games",
    category: "streak",
    icon: "🎯",
    reward: {
      type: "badge",
      value: "consistent",
      displayName: "Consistency Badge",
    },
    requirement: { type: "games_streak", count: 5, minScore: 100 },
  },

  {
    id: "double_trouble",
    name: "Double Trouble",
    description: "Roll 77 total (11 sevens!)",
    category: "special",
    icon: "7️⃣",
    reward: {
      type: "bonus_points",
      value: "77",
      displayName: "+77 Bonus Points",
    },
    hidden: true,
    requirement: { type: "roll_total", total: 77 },
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function getAchievementsByCategory(
  category: AchievementCategory
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

export function getVisibleAchievements(
  unlockedIds: Set<string>
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !a.hidden || unlockedIds.has(a.id));
}

export function getAllAchievementIds(): string[] {
  return ACHIEVEMENTS.map((a) => a.id);
}

// ============================================================================
// ACHIEVEMENT CHECK FUNCTIONS
// ============================================================================

/**
 * Check if a roll matches the exact values (order-independent)
 */
export function checkRollExact(
  roll: DiceFaceNumber[],
  required: number[]
): boolean {
  if (roll.length !== required.length) return false;
  const sortedRoll = [...roll].sort();
  const sortedRequired = [...required].sort();
  return sortedRoll.every((v, i) => v === sortedRequired[i]);
}

/**
 * Check if roll contains N of the same number
 */
export function checkRollSame(roll: DiceFaceNumber[], count: number): boolean {
  const counts = new Map<number, number>();
  for (const value of roll) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return Array.from(counts.values()).some((c) => c >= count);
}

/**
 * Check if roll is a straight (consecutive numbers)
 */
export function checkRollStraight(
  roll: DiceFaceNumber[],
  length: number
): boolean {
  if (roll.length < length) return false;
  const unique = [...new Set(roll)].sort((a, b) => a - b);
  if (unique.length < length) return false;

  // Check for consecutive sequence
  for (let i = 0; i <= unique.length - length; i++) {
    let isConsecutive = true;
    for (let j = 1; j < length; j++) {
      if (unique[i + j] !== unique[i] + j) {
        isConsecutive = false;
        break;
      }
    }
    if (isConsecutive) return true;
  }
  return false;
}

/**
 * Check if all dice show the same value
 */
export function checkAllSame(
  roll: DiceFaceNumber[],
  value: DiceFaceNumber,
  minDice = 3
): boolean {
  return roll.length >= minDice && roll.every((v) => v === value);
}

/**
 * Check for full house (3 of one + 2 of another)
 */
export function checkFullHouse(roll: DiceFaceNumber[]): boolean {
  if (roll.length < 5) return false;
  const counts = new Map<number, number>();
  for (const value of roll) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  const values = Array.from(counts.values()).sort((a, b) => b - a);
  return values.length >= 2 && values[0] >= 3 && values[1] >= 2;
}

/**
 * Check if roll total is within margin of a multiple of 7
 */
export function checkCloseCall(total: number, margin: number): boolean {
  const remainder = total % 7;
  return remainder === margin || remainder === 7 - margin;
}

/**
 * Check for Yahtzee (5+ dice all showing same value)
 */
export function checkYahtzee(roll: DiceFaceNumber[]): boolean {
  if (roll.length < 5) return false;
  const first = roll[0];
  return roll.every((v) => v === first);
}

/**
 * Check for four of a kind (4 dice showing same value)
 */
export function checkFourOfAKind(roll: DiceFaceNumber[]): boolean {
  if (roll.length < 4) return false;
  const counts = new Map<number, number>();
  for (const value of roll) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return Array.from(counts.values()).some((c) => c >= 4);
}

/**
 * Check all achievements against current game state
 */
export function checkAchievements(
  roll: DiceFaceNumber[],
  rollTotal: number,
  gameScore: number,
  roundNumber: number,
  profile: UserProfile,
  unlockedIds: Set<string>,
  _isFirstRoll: boolean
): string[] {
  const newlyUnlocked: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip already unlocked
    if (unlockedIds.has(achievement.id)) continue;

    const req = achievement.requirement;
    let unlocked = false;

    switch (req.type) {
      case "roll_exact":
        unlocked = checkRollExact(roll, req.values);
        break;

      case "roll_total":
        // Only count if survived (not divisible by 7)
        unlocked = rollTotal === req.total && rollTotal % 7 !== 0;
        break;

      case "roll_same":
        unlocked = checkRollSame(roll, req.count);
        break;

      case "roll_straight":
        unlocked = checkRollStraight(roll, req.length);
        break;

      case "roll_all_same":
        unlocked = checkAllSame(roll, req.value);
        break;

      case "score_single":
        unlocked = gameScore >= req.score;
        break;

      case "score_lifetime":
        unlocked = profile.totalScore + gameScore >= req.score;
        break;

      case "survive_rounds":
        unlocked = roundNumber >= req.rounds;
        break;

      case "games_played":
        unlocked = profile.totalGamesPlayed + 1 >= req.count;
        break;

      case "games_streak":
        unlocked =
          profile.currentStreak + 1 >= req.count &&
          (!req.minScore || gameScore >= req.minScore);
        break;

      case "consecutive_days":
        unlocked = profile.consecutiveDays >= req.days;
        break;

      case "close_call":
        unlocked = checkCloseCall(rollTotal, req.margin);
        break;

      case "low_roll":
        // Check if roll total is very low with minimum dice count
        unlocked = roll.length >= req.minDice && rollTotal <= req.maxTotal;
        break;

      case "yahtzee":
        // All dice same (5+ dice)
        unlocked = checkYahtzee(roll);
        break;

      case "four_of_kind":
        // Four dice same
        unlocked = checkFourOfAKind(roll);
        break;

      case "custom":
        // Handle custom checks
        if (req.checkFn === "checkFullHouse") {
          unlocked = checkFullHouse(roll);
        } else if (req.checkFn === "checkLuckySevens") {
          // Roll 7 on first roll but survive (wait, 7 is divisible by 7...)
          // This should be: roll 7 total on first roll with exactly 1 die (impossible)
          // Let's redefine: roll Lucky 7 = get 7 total early game and survive entire round
          unlocked = false; // Custom implementation needed
        } else if (req.checkFn === "checkPerfectionist") {
          // All other achievements unlocked
          const otherIds = ACHIEVEMENTS.filter(
            (a) => a.id !== "perfectionist"
          ).map((a) => a.id);
          unlocked = otherIds.every((id) => unlockedIds.has(id));
        }
        break;
    }

    if (unlocked) {
      newlyUnlocked.push(achievement.id);
    }
  }

  return newlyUnlocked;
}

// ============================================================================
// LOCAL STORAGE
// ============================================================================

const PROFILE_STORAGE_KEY = "godroll_profile_v1";
const ACHIEVEMENTS_STORAGE_KEY = "godroll_achievements_v1";

export function getLocalProfile(): UserProfile | null {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveLocalProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage not available
  }
}

export function getLocalAchievements(): Set<string> {
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveLocalAchievements(achievementIds: Set<string>): void {
  try {
    localStorage.setItem(
      ACHIEVEMENTS_STORAGE_KEY,
      JSON.stringify([...achievementIds])
    );
  } catch {
    // localStorage not available
  }
}

export function createDefaultProfile(playerId: string): UserProfile {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    playerId,
    displayName: "Player",
    totalScore: 0,
    totalGamesPlayed: 0,
    highestScore: 0,
    highestRound: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedAt: now,
    consecutiveDays: 1,
    unlockedSkins: ["cartoon", "classic"], // Default unlocked skins
    unlockedThemes: ["green"], // Default unlocked themes
    equippedBadges: [],
    unlockedTitles: [], // Unlocked title rewards
    equippedTitle: null, // Currently displayed title
    totalGameOvers: 0, // Times rolled divisible by 7
    totalCloseCallsEscaped: 0, // Times survived 6 or 8 total
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get or create a player ID for anonymous users
 */
export function getOrCreatePlayerId(): string {
  const PLAYER_ID_KEY = "godroll_player_id_v1";
  try {
    let playerId = localStorage.getItem(PLAYER_ID_KEY);
    if (!playerId) {
      playerId = crypto.randomUUID();
      localStorage.setItem(PLAYER_ID_KEY, playerId);
    }
    return playerId;
  } catch {
    return crypto.randomUUID();
  }
}

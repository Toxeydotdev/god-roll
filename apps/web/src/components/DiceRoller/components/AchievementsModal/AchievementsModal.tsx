/**
 * AchievementsModal - Displays all achievements and player progress
 *
 * Shows achievements organized by category with unlock status,
 * progress indicators, and reward information.
 */

import {
  Achievement,
  AchievementCategory,
  ACHIEVEMENTS,
  getAchievementById,
  getVisibleAchievements,
  UserProfile,
} from "@/components/DiceRoller/achievements";
import type { ColorTheme } from "@/components/DiceRoller/colorThemes";
import React, { useEffect, useMemo, useRef, useState } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface AchievementsModalProps {
  onClose: () => void;
  theme: ColorTheme;
  unlockedAchievements: Set<string>;
  profile: UserProfile;
  highlightAchievementId?: string;
}

type CategoryFilter = AchievementCategory | "all";

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_INFO: Record<
  AchievementCategory,
  { label: string; icon: string }
> = {
  roll: { label: "Roll", icon: "🎲" },
  score: { label: "Score", icon: "🔢" },
  survival: { label: "Survival", icon: "🏆" },
  streak: { label: "Streak", icon: "🔥" },
  play: { label: "Play", icon: "🎮" },
  special: { label: "Special", icon: "🌟" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function AchievementsModal({
  onClose,
  theme,
  unlockedAchievements,
  profile,
  highlightAchievementId,
}: AchievementsModalProps): React.ReactElement {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const highlightedCardRef = useRef<HTMLDivElement>(null);

  // If there's a highlight achievement, set the category filter to show it
  useEffect(() => {
    if (highlightAchievementId) {
      const achievement = getAchievementById(highlightAchievementId);
      if (achievement) {
        setCategoryFilter(achievement.category);
      }
    }
  }, [highlightAchievementId]);

  // Scroll to the highlighted achievement after filter changes
  useEffect(() => {
    if (highlightAchievementId && highlightedCardRef.current) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        highlightedCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [highlightAchievementId, categoryFilter]);

  // Get visible achievements (hide secret ones that aren't unlocked)
  const visibleAchievements = useMemo(
    () => getVisibleAchievements(unlockedAchievements),
    [unlockedAchievements]
  );

  // Filter by category
  const filteredAchievements = useMemo(() => {
    if (categoryFilter === "all") return visibleAchievements;
    return visibleAchievements.filter((a) => a.category === categoryFilter);
  }, [visibleAchievements, categoryFilter]);

  // Stats
  const totalUnlocked = unlockedAchievements.size;
  const totalAchievements = ACHIEVEMENTS.length;
  const progressPercentage = Math.round(
    (totalUnlocked / totalAchievements) * 100
  );

  const categories: CategoryFilter[] = [
    "all",
    "roll",
    "score",
    "survival",
    "streak",
    "play",
    "special",
  ];

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-30 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white/95 rounded-t-3xl sm:rounded-2xl p-6 pt-3 text-center shadow-2xl w-full sm:w-[90vw] sm:max-w-[500px] max-h-[85vh] flex flex-col"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pb-3 sm:hidden">
          <button
            onClick={onClose}
            className="w-10 h-1 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
            aria-label="Close"
          />
        </div>

        {/* Header */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2
              className="text-2xl font-black"
              style={{ color: theme.textPrimary }}
            >
              🏆 Achievements
            </h2>
            <button
              onClick={onClose}
              className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center text-lg hover:bg-black/10 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span style={{ color: theme.textSecondary }}>Progress</span>
              <span style={{ color: theme.textPrimary }}>
                {totalUnlocked} / {totalAchievements} ({progressPercentage}%)
              </span>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: `${theme.textTertiary}40` }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercentage}%`,
                  background: `linear-gradient(90deg, ${theme.accentColor}, ${theme.accentHover})`,
                }}
              />
            </div>
          </div>

          {/* Player Stats Summary */}
          <div
            className="grid grid-cols-4 gap-2 mb-4 text-center text-xs"
            style={{ color: theme.textSecondary }}
          >
            <div>
              <div
                className="text-lg font-bold"
                style={{ color: theme.textPrimary }}
              >
                {profile.totalGamesPlayed}
              </div>
              <div>Games</div>
            </div>
            <div>
              <div
                className="text-lg font-bold"
                style={{ color: theme.textPrimary }}
              >
                {profile.highestScore}
              </div>
              <div>Best Score</div>
            </div>
            <div>
              <div
                className="text-lg font-bold"
                style={{ color: theme.textPrimary }}
              >
                {profile.highestRound}
              </div>
              <div>Best Round</div>
            </div>
            <div>
              <div
                className="text-lg font-bold"
                style={{ color: theme.textPrimary }}
              >
                {profile.bestStreak}
              </div>
              <div>Best Streak</div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-1 mb-4">
            {categories.map((cat) => {
              const isActive = categoryFilter === cat;
              const label =
                cat === "all"
                  ? "All"
                  : CATEGORY_INFO[cat as AchievementCategory].label;
              const icon =
                cat === "all"
                  ? "📋"
                  : CATEGORY_INFO[cat as AchievementCategory].icon;

              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className="px-2 py-1 rounded-full text-xs font-bold transition-all"
                  style={{
                    backgroundColor: isActive
                      ? theme.textPrimary
                      : "transparent",
                    color: isActive ? theme.backgroundCss : theme.textSecondary,
                    border: `1px solid ${theme.textPrimary}`,
                  }}
                >
                  {icon} {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievement List */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto min-h-0"
        >
          <div className="space-y-2">
            {filteredAchievements.map((achievement) => {
              const isHighlighted = achievement.id === highlightAchievementId;
              return (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={unlockedAchievements.has(achievement.id)}
                  theme={theme}
                  isHighlighted={isHighlighted}
                  cardRef={isHighlighted ? highlightedCardRef : undefined}
                />
              );
            })}
          </div>

          {filteredAchievements.length === 0 && (
            <p
              className="text-center py-8"
              style={{ color: theme.textSecondary }}
            >
              No achievements in this category yet!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ACHIEVEMENT CARD
// ============================================================================

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  theme: ColorTheme;
  isHighlighted?: boolean;
  cardRef?: React.RefObject<HTMLDivElement>;
}

function AchievementCard({
  achievement,
  isUnlocked,
  theme,
  isHighlighted,
  cardRef,
}: AchievementCardProps): React.ReactElement {
  const getRewardIcon = () => {
    switch (achievement.reward.type) {
      case "dice_skin":
        return "🎲";
      case "theme":
        return "🎨";
      case "badge":
        return "🏷️";
      case "bonus_points":
        return "⭐";
      case "title":
        return "👑";
      default:
        return "🎁";
    }
  };

  return (
    <div
      ref={cardRef}
      className={`
        flex items-center gap-3 p-3 rounded-xl text-left transition-all
        ${
          isUnlocked
            ? ""
            : isHighlighted
            ? "opacity-80"
            : "opacity-60 grayscale"
        }
        ${isHighlighted ? "highlight-pulse" : ""}
      `}
      style={{
        backgroundColor: isUnlocked
          ? `${theme.accentColor}20`
          : `${theme.textTertiary}20`,
        border: `1px solid ${
          isUnlocked ? theme.accentColor : theme.textTertiary
        }40`,
        ...(isHighlighted && {
          ["--highlight-color" as string]: theme.accentColor,
        }),
      }}
    >
      {/* Icon */}
      <div
        className={`
          text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg
          ${isUnlocked ? "" : "filter grayscale"}
        `}
        style={{
          backgroundColor: isUnlocked
            ? `${theme.accentColor}30`
            : `${theme.textTertiary}30`,
        }}
      >
        {isUnlocked ? achievement.icon : "🔒"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-bold truncate"
            style={{ color: theme.textPrimary }}
          >
            {achievement.name}
          </span>
          {isUnlocked && (
            <span className="text-xs" title="Unlocked!">
              ✅
            </span>
          )}
        </div>
        <div
          className="text-xs truncate"
          style={{ color: theme.textSecondary }}
        >
          {achievement.description}
        </div>
        <div
          className="text-xs mt-1 flex items-center gap-1"
          style={{ color: theme.textTertiary }}
        >
          <span>{getRewardIcon()}</span>
          <span className="truncate">{achievement.reward.displayName}</span>
        </div>
      </div>

      {/* Category Badge */}
      <div
        className="flex-shrink-0 text-xs px-2 py-1 rounded-full"
        style={{
          backgroundColor: `${theme.textTertiary}30`,
          color: theme.textSecondary,
        }}
      >
        {CATEGORY_INFO[achievement.category].icon}
      </div>
    </div>
  );
}

export default AchievementsModal;

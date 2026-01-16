/**
 * RewardsModal - Displays unlockable rewards with category tabs
 *
 * Shows dice skins, themes, badges, and titles in a vertical scrolling list
 * with category filter tabs. Follows the same pattern as AchievementsModal.
 */

import { ACHIEVEMENTS } from "@/components/DiceRoller/achievements";
import type { ColorTheme } from "@/components/DiceRoller/colorThemes";
import { COLOR_THEMES } from "@/components/DiceRoller/colorThemes";
import { DICE_SKINS, DiceSkin } from "@/components/DiceRoller/diceSkins";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import React, { useMemo, useState } from "react";

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_SKINS = ["cartoon", "classic"];
const DEFAULT_THEMES = ["green", "gray", "cyan"];

type RewardCategory = "skins" | "themes" | "badges" | "titles";

const CATEGORY_INFO: Record<RewardCategory, { label: string; icon: string }> = {
  skins: { label: "Skins", icon: "🎲" },
  themes: { label: "Themes", icon: "🎨" },
  badges: { label: "Badges", icon: "🏷️" },
  titles: { label: "Titles", icon: "👑" },
};

// Badge definitions for display
const BADGE_INFO: Record<
  string,
  { name: string; icon: string; description: string }
> = {
  snake_eyes: { name: "Snake Eyes", icon: "🐍", description: "Rolled two 1s" },
  close_call: {
    name: "Close Call",
    icon: "😰",
    description: "Escaped doom by 1",
  },
  thousandaire: {
    name: "Thousandaire",
    icon: "💰",
    description: "Scored 1,000 total",
  },
  beginner: { name: "Beginner", icon: "🌱", description: "Survived 3 rounds" },
  regular: { name: "Regular", icon: "📅", description: "Played 10 games" },
  welcome: { name: "Welcome", icon: "🎲", description: "First game" },
  superstition: { name: "Superstition", icon: "🔮", description: "Rolled 13" },
  lucky_survivor: { name: "Lucky", icon: "🍀", description: "7 rounds" },
  low_roller: { name: "Low Roller", icon: "⬇️", description: "Very low roll" },
  consistent: { name: "Consistent", icon: "🎯", description: "5 games 100+" },
};

// Title definitions
const TITLE_INFO: Record<string, { name: string; description: string }> = {
  Veteran: { name: "Veteran", description: "Played 100 games" },
  Champion: { name: "Champion", description: "1,000 pts single game" },
  Legend: { name: "Legend", description: "Reached round 25" },
  Master: { name: "Master", description: "100k lifetime" },
};

// ============================================================================
// TYPES
// ============================================================================

export interface RewardsModalProps {
  onClose: () => void;
  theme: ColorTheme;
  unlockedAchievements: Set<string>;
  currentSkinId: string;
  currentThemeId: string;
  onSelectSkin: (skinId: string) => void;
  onSelectTheme: (themeId: string) => void;
  onViewAchievement: (achievementId: string) => void;
}

// ============================================================================
// HELPER: Derive unlocks from achievements
// ============================================================================

function getUnlocksFromAchievements(
  unlockedAchievements: Set<string>,
  rewardType: string
): string[] {
  return ACHIEVEMENTS.filter(
    (a) => unlockedAchievements.has(a.id) && a.reward.type === rewardType
  ).map((a) => a.reward.value);
}

/**
 * Find the achievement that unlocks a specific reward
 */
function findAchievementForReward(
  rewardValue: string,
  rewardType: string
): { id: string; name: string } | null {
  const achievement = ACHIEVEMENTS.find(
    (a) => a.reward.value === rewardValue && a.reward.type === rewardType
  );
  return achievement ? { id: achievement.id, name: achievement.name } : null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RewardsModal({
  onClose,
  theme,
  unlockedAchievements,
  currentSkinId,
  currentThemeId,
  onSelectSkin,
  onSelectTheme,
  onViewAchievement,
}: RewardsModalProps): React.ReactElement {
  const [activeCategory, setActiveCategory] = useState<RewardCategory>("skins");

  // Derive unlocked items from achievements + defaults
  const unlockedSkins = useMemo(() => {
    const fromAchievements = getUnlocksFromAchievements(
      unlockedAchievements,
      "dice_skin"
    );
    return [...new Set([...DEFAULT_SKINS, ...fromAchievements])];
  }, [unlockedAchievements]);

  const unlockedThemes = useMemo(() => {
    const fromAchievements = getUnlocksFromAchievements(
      unlockedAchievements,
      "theme"
    );
    return [...new Set([...DEFAULT_THEMES, ...fromAchievements])];
  }, [unlockedAchievements]);

  const unlockedBadges = useMemo(() => {
    return getUnlocksFromAchievements(unlockedAchievements, "badge");
  }, [unlockedAchievements]);

  const unlockedTitles = useMemo(() => {
    return getUnlocksFromAchievements(unlockedAchievements, "title");
  }, [unlockedAchievements]);

  // Sort items: unlocked first
  const sortedSkins = useMemo(
    () =>
      Object.values(DICE_SKINS).sort((a, b) => {
        const aUnlocked = unlockedSkins.includes(a.id);
        const bUnlocked = unlockedSkins.includes(b.id);
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;
        return 0;
      }),
    [unlockedSkins]
  );

  const sortedThemes = useMemo(
    () =>
      [...COLOR_THEMES].sort((a, b) => {
        const aUnlocked = unlockedThemes.includes(a.id);
        const bUnlocked = unlockedThemes.includes(b.id);
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;
        return 0;
      }),
    [unlockedThemes]
  );

  const sortedBadges = useMemo(
    () =>
      Object.entries(BADGE_INFO).sort(([aId], [bId]) => {
        const aUnlocked = unlockedBadges.includes(aId);
        const bUnlocked = unlockedBadges.includes(bId);
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;
        return 0;
      }),
    [unlockedBadges]
  );

  const sortedTitles = useMemo(
    () =>
      Object.entries(TITLE_INFO).sort(([aId], [bId]) => {
        const aUnlocked = unlockedTitles.includes(aId);
        const bUnlocked = unlockedTitles.includes(bId);
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;
        return 0;
      }),
    [unlockedTitles]
  );

  // Get counts for each category
  const counts: Record<RewardCategory, { unlocked: number; total: number }> = {
    skins: {
      unlocked: unlockedSkins.length,
      total: Object.keys(DICE_SKINS).length,
    },
    themes: { unlocked: unlockedThemes.length, total: COLOR_THEMES.length },
    badges: {
      unlocked: unlockedBadges.length,
      total: Object.keys(BADGE_INFO).length,
    },
    titles: {
      unlocked: unlockedTitles.length,
      total: Object.keys(TITLE_INFO).length,
    },
  };

  const categories: RewardCategory[] = ["skins", "themes", "badges", "titles"];

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        className="min-h-[50vh] max-h-[85vh] mx-auto sm:max-w-md flex flex-col overflow-hidden"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
      >
        <DrawerHeader className="text-center pb-0">
          <DrawerTitle
            className="text-2xl font-black"
            style={{ color: theme.textPrimary }}
          >
            🎁 Rewards
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 flex flex-col flex-1 overflow-hidden">
          {/* Category Tabs */}
          <div className="flex justify-center gap-1 mb-4">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const { label, icon } = CATEGORY_INFO[cat];
              const { unlocked, total } = counts[cat];

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-3 py-2 rounded-full text-xs font-bold transition-all"
                  style={{
                    backgroundColor: isActive
                      ? theme.textPrimary
                      : "transparent",
                    color: isActive ? theme.backgroundCss : theme.textSecondary,
                    border: `1px solid ${theme.textPrimary}`,
                  }}
                >
                  {icon} {label}
                  <span className="ml-1 opacity-70">
                    {unlocked}/{total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
            <div className="space-y-2">
              {activeCategory === "skins" &&
                sortedSkins.map((skin) => (
                  <SkinCard
                    key={skin.id}
                    skin={skin}
                    isUnlocked={unlockedSkins.includes(skin.id)}
                    isSelected={currentSkinId === skin.id}
                    onSelect={() => onSelectSkin(skin.id)}
                    theme={theme}
                    achievement={findAchievementForReward(skin.id, "dice_skin")}
                    onViewAchievement={onViewAchievement}
                  />
                ))}

              {activeCategory === "themes" &&
                sortedThemes.map((t) => (
                  <ThemeCard
                    key={t.id}
                    colorTheme={t}
                    isUnlocked={unlockedThemes.includes(t.id)}
                    isSelected={currentThemeId === t.id}
                    onSelect={() => onSelectTheme(t.id)}
                    theme={theme}
                    achievement={findAchievementForReward(t.id, "theme")}
                    onViewAchievement={onViewAchievement}
                  />
                ))}

              {activeCategory === "badges" &&
                sortedBadges.map(([id, badge]) => (
                  <BadgeCard
                    key={id}
                    badgeId={id}
                    badge={badge}
                    isUnlocked={unlockedBadges.includes(id)}
                    theme={theme}
                    achievement={findAchievementForReward(id, "badge")}
                    onViewAchievement={onViewAchievement}
                  />
                ))}

              {activeCategory === "titles" &&
                sortedTitles.map(([id, title]) => (
                  <TitleCard
                    key={id}
                    titleId={id}
                    title={title}
                    isUnlocked={unlockedTitles.includes(id)}
                    theme={theme}
                    achievement={findAchievementForReward(id, "title")}
                    onViewAchievement={onViewAchievement}
                  />
                ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ============================================================================
// SKIN CARD (List Item)
// ============================================================================

interface SkinCardProps {
  skin: DiceSkin;
  isUnlocked: boolean;
  isSelected: boolean;
  onSelect: () => void;
  theme: ColorTheme;
  achievement: { id: string; name: string } | null;
  onViewAchievement: (achievementId: string) => void;
}

function SkinCard({
  skin,
  isUnlocked,
  isSelected,
  onSelect,
  theme,
  achievement,
  onViewAchievement,
}: SkinCardProps): React.ReactElement {
  const handleClick = () => {
    if (isUnlocked) {
      onSelect();
    } else if (achievement) {
      onViewAchievement(achievement.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
        ${
          isUnlocked
            ? "hover:scale-[1.01] active:scale-[0.99]"
            : "hover:opacity-70 active:opacity-60"
        }
      `}
      style={{
        backgroundColor: isSelected
          ? `${theme.accentColor}25`
          : isUnlocked
          ? `${skin.diceColor}15`
          : `${theme.textTertiary}10`,
        border: `2px solid ${isSelected ? theme.accentColor : "transparent"}`,
      }}
    >
      {/* Dice preview */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
        style={{
          backgroundColor: isUnlocked ? skin.diceColor : "#ccc",
          color: isUnlocked ? skin.dotColor : "#999",
          opacity: skin.opacity ?? 1,
        }}
      >
        {isUnlocked ? "⚅" : "🔒"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-bold truncate"
            style={{ color: theme.textPrimary }}
          >
            {skin.name}
          </span>
          {isSelected && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: theme.accentColor,
                color: "white",
              }}
            >
              Active
            </span>
          )}
        </div>
        <div
          className="text-xs truncate flex items-center gap-1"
          style={{
            color: isUnlocked ? theme.textSecondary : theme.accentColor,
          }}
        >
          {isUnlocked ? (
            "Tap to equip"
          ) : achievement ? (
            <>View "{achievement.name}" →</>
          ) : (
            "Default skin"
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex-shrink-0 text-lg">
        {isUnlocked ? (isSelected ? "✓" : "") : achievement ? "→" : ""}
      </div>
    </button>
  );
}

// ============================================================================
// THEME CARD (List Item)
// ============================================================================

interface ThemeCardProps {
  colorTheme: ColorTheme;
  isUnlocked: boolean;
  isSelected: boolean;
  onSelect: () => void;
  theme: ColorTheme;
  achievement: { id: string; name: string } | null;
  onViewAchievement: (achievementId: string) => void;
}

function ThemeCard({
  colorTheme,
  isUnlocked,
  isSelected,
  onSelect,
  theme,
  achievement,
  onViewAchievement,
}: ThemeCardProps): React.ReactElement {
  const handleClick = () => {
    if (isUnlocked) {
      onSelect();
    } else if (achievement) {
      onViewAchievement(achievement.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
        ${
          isUnlocked
            ? "hover:scale-[1.01] active:scale-[0.99]"
            : "hover:opacity-70 active:opacity-60"
        }
      `}
      style={{
        backgroundColor: isSelected
          ? `${theme.accentColor}25`
          : `${theme.textTertiary}10`,
        border: `2px solid ${isSelected ? theme.accentColor : "transparent"}`,
      }}
    >
      {/* Theme preview */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{
          background: isUnlocked
            ? colorTheme.backgroundGradient
            : `${theme.textTertiary}30`,
        }}
      >
        {isUnlocked ? (
          <span style={{ color: colorTheme.textPrimary }}>🎨</span>
        ) : (
          "🔒"
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-bold truncate"
            style={{ color: theme.textPrimary }}
          >
            {colorTheme.name}
          </span>
          {isSelected && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: theme.accentColor,
                color: "white",
              }}
            >
              Active
            </span>
          )}
        </div>
        <div
          className="text-xs truncate flex items-center gap-1"
          style={{
            color: isUnlocked ? theme.textSecondary : theme.accentColor,
          }}
        >
          {isUnlocked ? (
            "Tap to apply"
          ) : achievement ? (
            <>View "{achievement.name}" →</>
          ) : (
            "Default theme"
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex-shrink-0 text-lg">
        {isUnlocked ? (isSelected ? "✓" : "") : achievement ? "→" : ""}
      </div>
    </button>
  );
}

// ============================================================================
// BADGE CARD (List Item)
// ============================================================================

interface BadgeCardProps {
  badgeId: string;
  badge: { name: string; icon: string; description: string };
  isUnlocked: boolean;
  theme: ColorTheme;
  achievement: { id: string; name: string } | null;
  onViewAchievement: (achievementId: string) => void;
}

function BadgeCard({
  badge,
  isUnlocked,
  theme,
  achievement,
  onViewAchievement,
}: BadgeCardProps): React.ReactElement {
  const handleClick = () => {
    if (!isUnlocked && achievement) {
      onViewAchievement(achievement.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isUnlocked}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
        ${isUnlocked ? "" : "hover:opacity-70 active:opacity-60 cursor-pointer"}
      `}
      style={{
        backgroundColor: isUnlocked
          ? `${theme.accentColor}15`
          : `${theme.textTertiary}10`,
      }}
    >
      {/* Badge icon */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
        style={{
          backgroundColor: isUnlocked
            ? `${theme.accentColor}25`
            : `${theme.textTertiary}20`,
        }}
      >
        {isUnlocked ? badge.icon : "🔒"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-bold truncate"
            style={{ color: theme.textPrimary }}
          >
            {badge.name}
          </span>
          {isUnlocked && <span className="text-xs">✅</span>}
        </div>
        <div
          className="text-xs truncate"
          style={{
            color: isUnlocked ? theme.textSecondary : theme.accentColor,
          }}
        >
          {isUnlocked ? (
            badge.description
          ) : achievement ? (
            <>View "{achievement.name}" →</>
          ) : (
            badge.description
          )}
        </div>
      </div>

      {/* Status */}
      {!isUnlocked && achievement && (
        <div className="flex-shrink-0 text-lg">→</div>
      )}
    </button>
  );
}

// ============================================================================
// TITLE CARD (List Item)
// ============================================================================

interface TitleCardProps {
  titleId: string;
  title: { name: string; description: string };
  isUnlocked: boolean;
  theme: ColorTheme;
  achievement: { id: string; name: string } | null;
  onViewAchievement: (achievementId: string) => void;
}

function TitleCard({
  title,
  isUnlocked,
  theme,
  achievement,
  onViewAchievement,
}: TitleCardProps): React.ReactElement {
  const handleClick = () => {
    if (!isUnlocked && achievement) {
      onViewAchievement(achievement.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isUnlocked}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
        ${isUnlocked ? "" : "hover:opacity-70 active:opacity-60 cursor-pointer"}
      `}
      style={{
        backgroundColor: isUnlocked
          ? `${theme.accentColor}15`
          : `${theme.textTertiary}10`,
      }}
    >
      {/* Title icon */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
        style={{
          backgroundColor: isUnlocked
            ? `${theme.accentColor}25`
            : `${theme.textTertiary}20`,
        }}
      >
        {isUnlocked ? "👑" : "🔒"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-bold truncate"
            style={{ color: theme.textPrimary }}
          >
            {title.name}
          </span>
          {isUnlocked && <span className="text-xs">✅</span>}
        </div>
        <div
          className="text-xs truncate"
          style={{
            color: isUnlocked ? theme.textSecondary : theme.accentColor,
          }}
        >
          {isUnlocked ? (
            title.description
          ) : achievement ? (
            <>View "{achievement.name}" →</>
          ) : (
            title.description
          )}
        </div>
      </div>

      {/* Status */}
      {!isUnlocked && achievement && (
        <div className="flex-shrink-0 text-lg">→</div>
      )}
    </button>
  );
}

export default RewardsModal;

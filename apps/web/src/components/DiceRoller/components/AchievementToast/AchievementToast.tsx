/**
 * AchievementToast - Displays achievement unlock notifications
 *
 * Shows a celebratory toast when the player unlocks an achievement.
 * Includes the achievement icon, name, description, and reward.
 */

import type { Achievement } from "@/components/DiceRoller/achievements";
import type { ColorTheme } from "@/components/DiceRoller/colorThemes";
import React, { useEffect, useState } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface AchievementToastProps {
  achievement: Achievement;
  theme: ColorTheme;
  onDismiss: () => void;
  autoDismissMs?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AchievementToast({
  achievement,
  theme,
  onDismiss,
  autoDismissMs = 5000,
}: AchievementToastProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss after timeout
  useEffect(() => {
    if (autoDismissMs <= 0) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300); // Match animation duration
  };

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
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        transition-all duration-300 ease-out
        ${
          isVisible && !isExiting
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4"
        }
      `}
      role="alert"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-sm border-2"
        style={{
          backgroundColor: `${theme.backgroundCss}f0`,
          borderColor: theme.accentColor,
          boxShadow: `0 8px 32px ${theme.buttonGlow}, 0 0 0 1px ${theme.accentColor}40`,
        }}
      >
        {/* Achievement Icon */}
        <div
          className="text-4xl flex-shrink-0 animate-bounce"
          style={{ animationDuration: "1s" }}
        >
          {achievement.icon}
        </div>

        {/* Content */}
        <div className="flex flex-col min-w-0">
          <div
            className="text-xs font-bold uppercase tracking-wider mb-1"
            style={{ color: theme.accentColor }}
          >
            🏆 Achievement Unlocked!
          </div>
          <div
            className="text-lg font-bold truncate"
            style={{ color: theme.textPrimary }}
          >
            {achievement.name}
          </div>
          <div
            className="text-sm truncate"
            style={{ color: theme.textSecondary }}
          >
            {achievement.description}
          </div>
          <div
            className="text-xs mt-1 flex items-center gap-1"
            style={{ color: theme.textTertiary }}
          >
            <span>{getRewardIcon()}</span>
            <span>{achievement.reward.displayName}</span>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-2 rounded-full transition-all hover:scale-110 active:scale-95"
          style={{ color: theme.textTertiary }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// TOAST CONTAINER (for multiple toasts)
// ============================================================================

export interface AchievementToastContainerProps {
  achievements: Array<{ achievement: Achievement; id: string }>;
  theme: ColorTheme;
  onDismiss: (id: string) => void;
}

export function AchievementToastContainer({
  achievements,
  theme,
  onDismiss,
}: AchievementToastContainerProps): React.ReactElement {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center gap-2 pt-4 pointer-events-none">
      {achievements.map(({ achievement, id }, index) => (
        <div
          key={id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 8}px)`,
            zIndex: 50 - index,
          }}
        >
          <AchievementToast
            achievement={achievement}
            theme={theme}
            onDismiss={() => onDismiss(id)}
            autoDismissMs={5000 + index * 1000} // Stagger auto-dismiss
          />
        </div>
      ))}
    </div>
  );
}

export default AchievementToast;

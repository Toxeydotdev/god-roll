/**
 * AchievementToast - Displays achievement unlock notifications
 *
 * Shows a pill-shaped banner similar to the "Nice Roll!" banner.
 * Positioned under the game title, tap to view details.
 */

import type { Achievement } from "@/components/DiceRoller/achievements";
import type { ColorTheme } from "@/components/DiceRoller/colorThemes";
import { useModal } from "@/components/DiceRoller/context";
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
  autoDismissMs = 4000,
}: AchievementToastProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const { openModal } = useModal();

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
    }, 300);
  };

  const handleViewDetails = () => {
    handleDismiss();
    openModal("achievements");
  };

  return (
    <div
      className={`
        fixed top-24 left-4 right-4 z-50 flex justify-center pointer-events-none
        transition-opacity duration-300 ease-out
        ${isVisible && !isExiting ? "opacity-100" : "opacity-0"}
      `}
      style={{ padding: "0 16px" }}
      role="alert"
      aria-live="polite"
    >
      {/* Pill-shaped banner like Nice Roll */}
      <button
        onClick={handleViewDetails}
        className={`
          flex items-center justify-center gap-2 px-4 py-2 rounded-full 
          cursor-pointer hover:scale-105 transition-transform pointer-events-auto
          ${isVisible && !isExiting ? "scale-100" : "scale-90"}
        `}
        style={{
          background: `linear-gradient(90deg, ${theme.accentColor}E8 0%, ${theme.accentHover}E8 100%)`,
          boxShadow: `0 2px 10px rgba(0,0,0,0.2), 0 0 20px ${theme.buttonGlow}`,
          border: `2px solid rgba(255,255,255,0.3)`,
          animation:
            isVisible && !isExiting
              ? "toast-pop-center 0.4s ease-out forwards"
              : undefined,
        }}
      >
        <span className="text-sm flex-shrink-0">{achievement.icon}</span>
        <span
          className="text-xs font-bold truncate"
          style={{
            color: "#fff",
            textShadow: "1px 1px 0 rgba(0,0,0,0.3)",
            maxWidth: "140px",
          }}
        >
          🏆 {achievement.name}
        </span>
        <span
          className="flex-shrink-0"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          •
        </span>
        <span
          className="text-xs flex-shrink-0"
          style={{ color: "rgba(255,255,255,0.95)", fontWeight: 600 }}
        >
          Tap to view
        </span>
      </button>
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index when achievements array changes significantly
  useEffect(() => {
    if (achievements.length === 0) {
      setCurrentIndex(0);
      setIsTransitioning(false);
    }
  }, [achievements.length]);

  const currentToast = achievements[currentIndex];

  if (!currentToast) {
    return <></>;
  }

  const handleDismiss = (id: string) => {
    // Start transition to prevent flash
    setIsTransitioning(true);

    // Small delay before showing next toast
    setTimeout(() => {
      onDismiss(id);
      setIsTransitioning(false);
    }, 150);
  };

  // Don't render during transition to prevent flash
  if (isTransitioning) {
    return <></>;
  }

  return (
    <AchievementToast
      key={currentToast.id}
      achievement={currentToast.achievement}
      theme={theme}
      onDismiss={() => handleDismiss(currentToast.id)}
      autoDismissMs={3000}
    />
  );
}

export default AchievementToast;

import { useTheme } from "@/components/DiceRoller/context";
import React, { useEffect, useState } from "react";

interface RoundCompleteBannerProps {
  round: number;
  lastScore: number;
  isRolling: boolean;
  gameOver: boolean;
}

// Only show banner for exceptional rolls (>70% of max possible)
const EXCEPTIONAL_ROLL_THRESHOLD = 0.7;

export function RoundCompleteBanner({
  round,
  lastScore,
  isRolling,
  gameOver,
}: RoundCompleteBannerProps): React.ReactElement | null {
  const { theme } = useTheme();
  const [showBanner, setShowBanner] = useState(false);
  const [displayScore, setDisplayScore] = useState(lastScore);
  const [nextDiceCount, setNextDiceCount] = useState(round);

  // Show banner only for exceptional rolls (>70% of max possible score)
  useEffect(() => {
    if (!isRolling && !gameOver && round > 1 && lastScore > 0) {
      // Calculate max possible score for the round that just completed
      // Previous round had (round - 1) dice, each die max is 6
      const diceCountForCompletedRound = round - 1;
      const maxPossibleScore = diceCountForCompletedRound * 6;
      const scorePercentage = lastScore / maxPossibleScore;

      // Only show banner if score is exceptional (>70% of max)
      if (scorePercentage >= EXCEPTIONAL_ROLL_THRESHOLD) {
        setDisplayScore(lastScore);
        setNextDiceCount(round); // Current round = number of dice for next roll
        setShowBanner(true);

        // Hide quickly - just 1 second so it doesn't block rapid rolls
        const timer = setTimeout(() => {
          setShowBanner(false);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [isRolling, gameOver, round, lastScore]);

  if (!showBanner) return null;

  return (
    <div
      className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none"
      style={{
        animation: "toast-pop 1s ease-out forwards",
      }}
    >
      {/* Compact toast-style notification */}
      <div
        className="flex items-center gap-3 px-4 py-2 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${theme.accentColor}E8 0%, ${theme.accentHover}E8 100%)`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.25), 0 0 30px ${theme.buttonGlow}`,
          border: `2px solid rgba(255,255,255,0.3)`,
        }}
      >
        {/* Points earned */}
        <span
          className="text-xl font-bold"
          style={{
            color: "#fff",
            fontFamily: "var(--font-display)",
            textShadow: "1px 1px 0 rgba(0,0,0,0.3)",
          }}
        >
          +{displayScore}
        </span>

        {/* Divider */}
        <span style={{ color: "rgba(255,255,255,0.5)" }}>•</span>

        {/* Dice count */}
        <span
          className="flex items-center gap-1"
          style={{
            color: "rgba(255,255,255,0.95)",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          <span>🎲</span>
          <span>×{nextDiceCount}</span>
        </span>
      </div>
    </div>
  );
}

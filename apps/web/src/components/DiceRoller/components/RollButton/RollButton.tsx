import { useGameState, useTheme } from "@/components/DiceRoller/context";
import React, { useEffect, useRef, useState } from "react";

// Only show banner for exceptional rolls (>70% of max possible)
const EXCEPTIONAL_ROLL_THRESHOLD = 0.7;
// Show low roll banner for rolls <=20% of max possible
const LOW_ROLL_THRESHOLD = 0.2;

interface RollButtonProps {
  onRoll: () => void;
}

// Simple dice SVG icon
function DiceIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
      <circle cx="8" cy="8" r="1.5" fill="white" />
      <circle cx="12" cy="12" r="1.5" fill="white" />
      <circle cx="16" cy="16" r="1.5" fill="white" />
      <circle cx="16" cy="8" r="1.5" fill="white" />
      <circle cx="8" cy="16" r="1.5" fill="white" />
    </svg>
  );
}

export function RollButton({ onRoll }: RollButtonProps): React.ReactElement {
  const { theme } = useTheme();
  const { results, lastRollTotal, isRolling, round, gameOver } = useGameState();

  const [showResult, setShowResult] = useState(false);
  const [animateResult, setAnimateResult] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showLowRollBanner, setShowLowRollBanner] = useState(false);
  const wasRollingRef = useRef<boolean>(false);
  const isDanger = lastRollTotal % 7 === 0;

  // Trigger result animation when results change
  useEffect(() => {
    if (results.length > 0 && !isRolling) {
      setShowResult(false);
      setAnimateResult(false);
      // Small delay for dramatic effect
      const timer = setTimeout(() => {
        setShowResult(true);
        setAnimateResult(true);
        // Reset animation state after animation completes
        setTimeout(() => setAnimateResult(false), 600);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [results, isRolling, lastRollTotal]);

  // Show banners based on roll quality
  // Only trigger when transitioning from rolling to not rolling
  useEffect(() => {
    const justFinishedRolling = wasRollingRef.current && !isRolling;
    wasRollingRef.current = isRolling;

    if (justFinishedRolling && !gameOver && round > 1 && lastRollTotal > 0) {
      const diceCountForCompletedRound = round - 1;
      const maxPossibleScore = diceCountForCompletedRound * 6;
      const scorePercentage = lastRollTotal / maxPossibleScore;

      if (scorePercentage >= EXCEPTIONAL_ROLL_THRESHOLD) {
        setShowBanner(true);
        const timer = setTimeout(() => setShowBanner(false), 2500);
        return () => clearTimeout(timer);
      } else if (
        scorePercentage <= LOW_ROLL_THRESHOLD &&
        diceCountForCompletedRound >= 2
      ) {
        // Only show low roll banner when there are at least 2 dice
        setShowLowRollBanner(true);
        const timer = setTimeout(() => setShowLowRollBanner(false), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [isRolling, gameOver, round, lastRollTotal]);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Results display with optional banner */}
      <div className="flex items-center justify-center gap-3">
        {/* Nice roll banner - positioned to the left, content pushed right toward score */}
        <div className="w-24 flex items-center justify-end">
          {showBanner && (
            <div
              className="flex items-center gap-1 px-3 py-1 rounded-full whitespace-nowrap"
              style={{
                background: `linear-gradient(90deg, ${theme.accentColor}E8 0%, ${theme.accentHover}E8 100%)`,
                boxShadow: `0 2px 10px rgba(0,0,0,0.2), 0 0 20px ${theme.buttonGlow}`,
                border: `2px solid rgba(255,255,255,0.3)`,
                animation: "toast-pop-side 1.5s ease-out forwards",
              }}
            >
              <span
                className="text-sm font-bold"
                style={{
                  color: "#fff",
                  textShadow: "1px 1px 0 rgba(0,0,0,0.3)",
                }}
              >
                🎯 Nice Roll!
              </span>
            </div>
          )}
        </div>

        {/* Score display - fixed width container so it doesn't shift */}
        <div
          className={`w-32 flex flex-col items-center min-h-[80px] justify-end ${
            results.length > 0 && !isRolling && showResult && animateResult
              ? "pop-in"
              : ""
          }`}
        >
          {results.length > 0 && !isRolling && showResult && (
            <>
              {/* Large roll total */}
              <span
                className={`text-5xl font-bold ${
                  animateResult
                    ? isDanger
                      ? "danger-pulse shake"
                      : "success-glow"
                    : ""
                }`}
                style={{
                  color: isDanger ? theme.dangerColor : theme.textPrimary,
                  fontFamily: "var(--font-display)",
                  textShadow: isDanger
                    ? `0 0 20px ${theme.dangerColor}, 3px 3px 0px rgba(0,0,0,0.3)`
                    : `0 0 20px ${theme.successColor}, 3px 3px 0px rgba(0,0,0,0.2)`,
                  ["--success-color" as string]: theme.successColor,
                  ["--danger-color" as string]: theme.dangerColor,
                }}
              >
                {lastRollTotal}
              </span>
              {/* Dice breakdown - smaller */}
              <span
                className="text-sm mt-1"
                style={{
                  color: theme.textSecondary,
                  fontWeight: 600,
                }}
              >
                {results.join(" + ")}
              </span>
            </>
          )}
        </div>

        {/* Low roll banner - positioned to the right, content pushed left toward score */}
        <div className="w-24 flex items-center justify-start">
          {showLowRollBanner && (
            <div
              className="flex items-center gap-1 px-3 py-1 rounded-full whitespace-nowrap"
              style={{
                background: `linear-gradient(90deg, ${theme.dangerColor}CC 0%, ${theme.dangerColor}E8 100%)`,
                boxShadow: `0 2px 10px rgba(0,0,0,0.3), 0 0 20px ${theme.dangerColor}80`,
                border: `2px solid rgba(255,255,255,0.3)`,
                animation: "toast-pop-side 1.5s ease-out forwards",
              }}
            >
              <span
                className="text-sm font-bold"
                style={{
                  color: "#fff",
                  textShadow: "1px 1px 0 rgba(0,0,0,0.3)",
                }}
              >
                😬 Low!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Compact FAB-style roll button */}
      <button
        onClick={onRoll}
        disabled={isRolling}
        data-testid="roll-button"
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${
          !isRolling ? "roll-button-idle" : ""
        }`}
        style={{
          color: theme.backgroundCss,
          backgroundColor: theme.accentColor,
          ["--button-shadow" as string]: `0 4px 0 ${theme.accentHover}, 0 6px 15px rgba(0,0,0,0.3)`,
          ["--glow-color" as string]: theme.buttonGlow,
          boxShadow: `0 4px 0 ${theme.accentHover}, 0 6px 15px rgba(0,0,0,0.3), 0 0 30px ${theme.buttonGlow}`,
          border: `3px solid ${theme.accentHover}`,
        }}
      >
        {isRolling ? (
          <span className="text-2xl animate-spin">🎲</span>
        ) : (
          <DiceIcon size={32} />
        )}
      </button>
    </div>
  );
}

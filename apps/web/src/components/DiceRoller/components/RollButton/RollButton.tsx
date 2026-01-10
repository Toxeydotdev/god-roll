import { useTheme } from "@/components/DiceRoller/context";
import React, { useEffect, useState } from "react";
import { DiceFaceNumber } from "../../types";

interface RollButtonProps {
  results: DiceFaceNumber[];
  lastRollTotal: number;
  isRolling: boolean;
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

export function RollButton({
  results,
  lastRollTotal,
  isRolling,
  onRoll,
}: RollButtonProps): React.ReactElement {
  const { theme } = useTheme();
  const [showResult, setShowResult] = useState(false);
  const [animateResult, setAnimateResult] = useState(false);
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

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Results display */}
      <div
        className={`flex flex-col items-center min-h-[80px] justify-end ${
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

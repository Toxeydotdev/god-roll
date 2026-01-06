import { useTheme } from "@/components/DiceRoller/context";
import React from "react";
import { DiceFaceNumber } from "../types";

interface RollButtonProps {
  results: DiceFaceNumber[];
  lastRollTotal: number;
  isRolling: boolean;
  onRoll: () => void;
}

export function RollButton({
  results,
  lastRollTotal,
  isRolling,
  onRoll,
}: RollButtonProps): React.ReactElement {
  const { theme } = useTheme();
  return (
    <div
      className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}
    >
      {/* Show results */}
      {results.length > 0 && !isRolling && (
        <div className="flex flex-col items-center gap-1 mb-2">
          <span
            className="text-lg tracking-wide"
            style={{ 
              color: theme.textPrimary,
              fontFamily: 'var(--font-display)',
              textShadow: '2px 2px 0px rgba(0,0,0,0.15)',
              fontWeight: 600,
            }}
          >
            ROLL: {lastRollTotal} {lastRollTotal % 7 === 0 ? "💀" : "✓"}
          </span>
          <span
            className="text-sm tracking-wider"
            style={{ 
              color: theme.textTertiary,
              fontWeight: 600,
            }}
          >
            [{results.join(" + ")}]
          </span>
        </div>
      )}
      <button
        onClick={onRoll}
        disabled={isRolling}
        data-testid="roll-button"
        className="text-4xl tracking-wider px-8 py-2 rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        style={{ 
          color: theme.textPrimary,
          fontFamily: 'var(--font-display)',
          textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
          boxShadow: '0 4px 0 rgba(0,0,0,0.2)',
          letterSpacing: '0.1em',
        }}
      >
        ROLL
      </button>
    </div>
  );
}

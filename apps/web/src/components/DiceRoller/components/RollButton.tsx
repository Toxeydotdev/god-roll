import React from "react";
import { COLORS } from "../constants";
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
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
      {/* Show results */}
      {results.length > 0 && !isRolling && (
        <div className="flex flex-col items-center gap-1 mb-2">
          <span
            className="text-lg font-bold tracking-wide"
            style={{ color: "#5a4a3a" }}
          >
            ROLL: {lastRollTotal} {lastRollTotal % 7 === 0 ? "💀" : "✓"}
          </span>
          <span
            className="text-sm tracking-wider"
            style={{ color: COLORS.textTertiary }}
          >
            [{results.join(" + ")}]
          </span>
        </div>
      )}
      <button
        onClick={onRoll}
        disabled={isRolling}
        className="text-4xl font-black tracking-wider px-8 py-2 rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        style={{ color: "#5a4a3a" }}
      >
        ROLL
      </button>
    </div>
  );
}

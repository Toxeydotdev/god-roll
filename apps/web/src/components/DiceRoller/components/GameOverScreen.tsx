import React from "react";
import { COLORS } from "../constants";

interface GameOverScreenProps {
  lastRollTotal: number;
  totalScore: number;
  round: number;
  onPlayAgain: () => void;
}

export function GameOverScreen({
  lastRollTotal,
  totalScore,
  round,
  onPlayAgain,
}: GameOverScreenProps): React.ReactElement {
  const roundsSurvived = round - 1;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
      <div className="bg-white/95 rounded-2xl p-8 text-center shadow-2xl">
        <h2 className="text-4xl font-black mb-2" style={{ color: "#c44" }}>
          GAME OVER!
        </h2>
        <p className="text-xl mb-1" style={{ color: COLORS.textPrimary }}>
          You rolled {lastRollTotal} (divisible by 7)
        </p>
        <p
          className="text-2xl font-bold mb-4"
          style={{ color: COLORS.textPrimary }}
        >
          Final Score: {totalScore}
        </p>
        <p className="text-lg mb-4" style={{ color: COLORS.textSecondary }}>
          You survived {roundsSurvived} round{roundsSurvived !== 1 ? "s" : ""}!
        </p>
        <button
          onClick={onPlayAgain}
          className="text-2xl font-black px-8 py-3 rounded-full transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: COLORS.textPrimary,
            color: COLORS.backgroundCss,
          }}
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}

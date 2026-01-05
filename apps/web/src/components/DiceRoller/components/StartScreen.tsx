import React from "react";
import { COLORS } from "../constants";

interface StartScreenProps {
  onStartGame: () => void;
}

export function StartScreen({
  onStartGame,
}: StartScreenProps): React.ReactElement {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <div className="text-center">
        <h2
          className="text-6xl font-black mb-4"
          style={{ color: COLORS.textPrimary }}
        >
          GOD ROLL
        </h2>
        <p className="text-xl mb-2" style={{ color: COLORS.textSecondary }}>
          Roll dice to score points
        </p>
        <p className="text-lg mb-6" style={{ color: COLORS.textTertiary }}>
          Avoid totals divisible by 7!
        </p>
        <button
          onClick={onStartGame}
          className="text-3xl font-black px-10 py-4 rounded-full transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: COLORS.textPrimary,
            color: COLORS.backgroundCss,
          }}
        >
          START GAME
        </button>
        <p className="text-sm mt-4" style={{ color: "#aaa" }}>
          Dice increase each round
        </p>
      </div>
    </div>
  );
}

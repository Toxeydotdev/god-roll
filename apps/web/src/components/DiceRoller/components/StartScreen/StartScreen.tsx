import { ColorTheme } from "@/components/DiceRoller/colorThemes";
import React from "react";

interface StartScreenProps {
  onStartGame: () => void;
  onShowColorPicker: () => void;
  onShowLeaderboard: () => void;
  theme: ColorTheme;
}

export function StartScreen({
  onStartGame,
  onShowColorPicker,
  onShowLeaderboard,
  theme,
}: StartScreenProps): React.ReactElement {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <div className="text-center">
        <h2
          className="text-6xl font-black mb-4"
          style={{ color: theme.textPrimary }}
        >
          GOD ROLL
        </h2>
        <p className="text-xl mb-2" style={{ color: theme.textSecondary }}>
          Roll dice to score points
        </p>
        <p className="text-lg mb-6" style={{ color: theme.textTertiary }}>
          Avoid totals divisible by 7!
        </p>
        <button
          onClick={onStartGame}
          className="text-3xl font-black px-10 py-4 rounded-full transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: theme.textPrimary,
            color: theme.backgroundCss,
          }}
        >
          START GAME
        </button>
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={onShowColorPicker}
            className="px-4 py-2 rounded-full font-bold text-base transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: theme.textSecondary,
              color: theme.backgroundCss,
            }}
          >
            🎨 Theme
          </button>
          <button
            onClick={onShowLeaderboard}
            className="px-4 py-2 rounded-full font-bold text-base transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: theme.textSecondary,
              color: theme.backgroundCss,
            }}
          >
            🏆 Leaderboard
          </button>
        </div>
        <p className="text-sm mt-4" style={{ color: theme.textTertiary }}>
          Dice increase each round
        </p>
      </div>
    </div>
  );
}

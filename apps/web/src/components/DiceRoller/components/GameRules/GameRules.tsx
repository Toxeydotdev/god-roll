import React from "react";
import { ColorTheme } from "../colorThemes";

interface GameRulesProps {
  onClose: () => void;
  theme: ColorTheme;
}

export function GameRules({
  onClose,
  theme,
}: GameRulesProps): React.ReactElement {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60 p-4">
      <div className="bg-white/95 rounded-2xl p-6 text-left shadow-2xl max-w-md max-h-[90vh] overflow-auto">
        <h2
          className="text-2xl font-black mb-4 text-center"
          style={{ color: theme.textPrimary }}
        >
          📜 How to Play
        </h2>

        <div
          className="space-y-3 text-base"
          style={{ color: theme.textPrimary }}
        >
          <div>
            <span className="font-bold">🎯 Goal:</span> Score as high as
            possible without rolling a total divisible by 7.
          </div>

          <div>
            <span className="font-bold">🎲 Each Round:</span> Roll the dice.
            Your roll total is added to your score.
          </div>

          <div>
            <span className="font-bold">📈 Dice Increase:</span> You start with
            1 die. Each successful round adds another die (up to 6).
          </div>

          <div>
            <span className="font-bold">💀 Game Over:</span> If your roll total
            is divisible by 7, the game ends!
          </div>

          <div className="pt-2 border-t border-gray-200">
            <span className="font-bold">💡 Tip:</span> More dice = higher
            scores, but also more risk of hitting a multiple of 7!
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: theme.textPrimary,
              color: theme.backgroundCss,
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

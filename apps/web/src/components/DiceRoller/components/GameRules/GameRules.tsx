import { ColorTheme } from "@/components/DiceRoller/colorThemes";
import React from "react";

interface GameRulesProps {
  onClose: () => void;
  theme: ColorTheme;
}

export function GameRules({
  onClose,
  theme,
}: GameRulesProps): React.ReactElement {
  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-30 bg-black/60"
      style={{ touchAction: "none" }}
      onClick={onClose}
    >
      <div
        className="bg-white/95 rounded-t-3xl sm:rounded-2xl p-6 pt-3 text-left shadow-2xl w-full sm:w-auto sm:max-w-md max-h-[85vh] overflow-auto"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          overscrollBehavior: "contain",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pb-3 sm:hidden">
          <button
            onClick={onClose}
            className="w-10 h-1 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
            aria-label="Close"
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-2xl font-black"
            style={{ color: theme.textPrimary }}
          >
            📜 How to Play
          </h2>
          <button
            onClick={onClose}
            className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center text-lg hover:bg-black/10 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div
          className="space-y-3 text-base"
          style={{ color: theme.textPrimary }}
        >
          <div>
            <span className="font-bold">🎯 Goal:</span> Score as high as
            possible without rolling a total divisible by 7.
          </div>

          <div>
            <span className="font-bold">🎲 Each Round:</span> Roll all the dice.
            Your roll total is added to your score.
          </div>

          <div>
            <span className="font-bold">📈 Dice Increase:</span> You start with
            1 die. Each successful round adds another die to your pool.
          </div>

          <div>
            <span className="font-bold">💀 Game Over:</span> If your roll total
            is divisible by 7, the game ends!
          </div>

          <div className="pt-2 border-t border-gray-200">
            <span className="font-bold">💡 Tip:</span> More dice means higher
            potential scores, but also increases your risk of hitting a multiple
            of 7!
          </div>
        </div>
      </div>
    </div>
  );
}

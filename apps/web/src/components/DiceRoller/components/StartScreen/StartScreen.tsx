import { useModal, useTheme } from "@/components/DiceRoller/context";
import React from "react";

interface StartScreenProps {
  onStartGame: () => void;
}

export function StartScreen({
  onStartGame,
}: StartScreenProps): React.ReactElement {
  const { openModal } = useModal();
  const { theme } = useTheme();
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <div className="text-center">
        <h2
          className="text-6xl mb-4"
          style={{ 
            color: theme.textPrimary,
            fontFamily: 'var(--font-display)',
            textShadow: '4px 4px 0px rgba(0,0,0,0.2)',
            letterSpacing: '0.05em',
          }}
        >
          GOD ROLL
        </h2>
        <p 
          className="text-xl mb-2" 
          style={{ 
            color: theme.textSecondary,
            fontWeight: 600,
          }}
        >
          Roll dice to score points
        </p>
        <p 
          className="text-lg mb-6" 
          style={{ 
            color: theme.textTertiary,
            fontWeight: 600,
          }}
        >
          Avoid totals divisible by 7!
        </p>
        <button
          onClick={onStartGame}
          className="text-3xl px-10 py-4 rounded-full transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: theme.textPrimary,
            color: theme.backgroundCss,
            fontFamily: 'var(--font-display)',
            textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
            boxShadow: '0 6px 0 rgba(0,0,0,0.2)',
            letterSpacing: '0.05em',
          }}
        >
          START GAME
        </button>
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={() => openModal("colorPicker")}
            className="px-4 py-2 rounded-full text-base transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: theme.textSecondary,
              color: theme.backgroundCss,
              fontWeight: 600,
              boxShadow: '0 3px 0 rgba(0,0,0,0.2)',
            }}
          >
            🎨 Theme
          </button>
          <button
            onClick={() => openModal("leaderboard")}
            className="px-4 py-2 rounded-full text-base transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: theme.textSecondary,
              color: theme.backgroundCss,
              fontWeight: 600,
              boxShadow: '0 3px 0 rgba(0,0,0,0.2)',
            }}
          >
            🏆 Leaderboard
          </button>
        </div>
        <p 
          className="text-sm mt-4" 
          style={{ 
            color: theme.textTertiary,
            fontWeight: 600,
          }}
        >
          Dice increase each round
        </p>
      </div>
    </div>
  );
}

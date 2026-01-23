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
      <div className="text-center fade-in">
        {/* Main title with enhanced styling */}
        <h2
          className="text-7xl mb-2 float"
          style={{
            color: theme.textPrimary,
            fontFamily: "var(--font-display)",
            textShadow: `
              4px 4px 0px rgba(0,0,0,0.2),
              0 0 30px ${theme.buttonGlow}
            `,
            letterSpacing: "0.08em",
          }}
        >
          GOD-ROLL
        </h2>

        {/* Decorative dice emoji */}
        <div className="text-4xl mb-4 opacity-80">🎲 🎲 🎲</div>

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
          className="text-lg mb-8"
          style={{
            color: theme.textTertiary,
            fontWeight: 600,
          }}
        >
          Avoid totals divisible by 7!
        </p>

        {/* Enhanced start button with glow */}
        <button
          onClick={onStartGame}
          data-testid="start-button"
          className="text-3xl px-12 py-5 rounded-full transition-all hover:scale-105 active:scale-95 roll-button-idle"
          style={{
            backgroundColor: theme.accentColor,
            color: theme.backgroundCss,
            fontFamily: "var(--font-display)",
            textShadow: "2px 2px 0px rgba(0,0,0,0.3)",
            ["--button-shadow" as string]: `0 6px 0 ${theme.accentHover}, 0 10px 30px rgba(0,0,0,0.3)`,
            ["--glow-color" as string]: theme.buttonGlow,
            boxShadow: `0 6px 0 ${theme.accentHover}, 0 10px 30px rgba(0,0,0,0.3), 0 0 30px ${theme.buttonGlow}`,
            letterSpacing: "0.08em",
            border: `4px solid ${theme.accentHover}`,
          }}
        >
          START GAME
        </button>

        {/* Secondary buttons */}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => openModal("leaderboard")}
            className="px-5 py-2.5 rounded-full text-base transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: theme.textSecondary,
              color: theme.backgroundCss,
              fontWeight: 600,
              boxShadow: "0 4px 0 rgba(0,0,0,0.2), 0 6px 15px rgba(0,0,0,0.15)",
            }}
          >
            🏆 Scores
          </button>
        </div>

        {/* Game info */}
        <div
          className="mt-6 px-4 py-3 rounded-lg flex flex-col gap-2"
          style={{
            backgroundColor: "rgba(0,0,0,0.1)",
          }}
        >
          <p
            className="text-sm"
            style={{
              color: theme.textSecondary,
              fontWeight: 600,
            }}
          >
            🎯 Each round adds +1 die
          </p>
          <a
            href="mailto:support@god-roll.com"
            className="text-sm hover:opacity-80 transition-opacity"
            style={{
              color: theme.textSecondary,
              fontWeight: 600,
            }}
          >
            💬 Need help? support@god-roll.com
          </a>
        </div>
      </div>
    </div>
  );
}

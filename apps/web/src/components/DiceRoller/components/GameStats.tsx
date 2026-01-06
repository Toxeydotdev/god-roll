import React, { useRef, useState } from "react";
import { ColorTheme } from "../colorThemes";

export interface GameStatsProps {
  totalScore: number;
  round: number;
  onReset: () => void;
  onShowLeaderboard: () => void;
  onShowRules: () => void;
  onShowColorPicker: () => void;
  theme: ColorTheme;
}

export function GameStats({
  totalScore,
  round,
  onReset,
  onShowLeaderboard,
  onShowRules,
  onShowColorPicker,
  theme,
}: GameStatsProps): React.ReactElement {
  const [resetProgress, setResetProgress] = useState<number>(0);
  const resetTimerRef = useRef<number | null>(null);

  const handleMouseDown = () => {
    const startTime = Date.now();
    const holdDuration = 1000;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / holdDuration, 1);
      setResetProgress(progress);

      if (progress >= 1) {
        onReset();
        setResetProgress(0);
      } else {
        resetTimerRef.current = requestAnimationFrame(tick);
      }
    };

    resetTimerRef.current = requestAnimationFrame(tick);
  };

  const handleMouseUp = () => {
    if (resetTimerRef.current) {
      cancelAnimationFrame(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setResetProgress(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent mouse event emulation
    handleMouseDown();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  };

  return (
    <div className="absolute top-4 right-4 z-10 text-right">
      <div className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
        SCORE: {totalScore}
      </div>
      <div className="text-lg" style={{ color: theme.textSecondary }}>
        Round {round}
      </div>
      <div className="flex gap-2 mt-2 justify-end">
        <button
          onClick={onShowColorPicker}
          className="text-sm font-bold px-3 py-1 rounded-full transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: theme.textSecondary,
            color: theme.backgroundCss,
          }}
        >
          🎨
        </button>
        <button
          onClick={onShowRules}
          className="text-sm font-bold px-3 py-1 rounded-full transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: theme.textSecondary,
            color: theme.backgroundCss,
          }}
        >
          ❓
        </button>
        <button
          onClick={onShowLeaderboard}
          className="text-sm font-bold px-3 py-1 rounded-full transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: theme.textSecondary,
            color: theme.backgroundCss,
          }}
        >
          🏆
        </button>
        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="text-sm font-bold px-4 py-1 rounded-full transition-all relative overflow-hidden touch-none"
          style={{
            backgroundColor: theme.textPrimary,
            color: theme.backgroundCss,
          }}
        >
          <span
            className="absolute inset-0 bg-red-500 transition-none"
            style={{
              width: `${resetProgress * 100}%`,
              opacity: 0.6,
            }}
          />
          <span className="relative">
            {resetProgress > 0 ? "HOLD..." : "RESET"}
          </span>
        </button>
      </div>
    </div>
  );
}

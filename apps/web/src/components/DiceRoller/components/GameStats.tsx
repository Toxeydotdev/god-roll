import React, { useRef, useState } from "react";
import { COLORS } from "../constants";

interface GameStatsProps {
  totalScore: number;
  round: number;
  onReset: () => void;
}

export function GameStats({
  totalScore,
  round,
  onReset,
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

  return (
    <div className="absolute top-4 right-4 z-10 text-right">
      <div className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
        SCORE: {totalScore}
      </div>
      <div className="text-lg" style={{ color: COLORS.textSecondary }}>
        Round {round}
      </div>
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="mt-2 text-sm font-bold px-4 py-1 rounded-full transition-all relative overflow-hidden"
        style={{
          backgroundColor: COLORS.textPrimary,
          color: COLORS.backgroundCss,
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
  );
}

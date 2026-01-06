import React from "react";
import { COLORS } from "../constants";
import { clearLeaderboard, LeaderboardEntry } from "../leaderboard";

interface GameOverScreenProps {
  lastRollTotal: number;
  totalScore: number;
  round: number;
  onPlayAgain: () => void;
  highlightIndex?: number;
  leaderboardEntries: LeaderboardEntry[];
  onLeaderboardChange: (entries: LeaderboardEntry[]) => void;
}

export function GameOverScreen({
  lastRollTotal,
  totalScore,
  round,
  onPlayAgain,
  highlightIndex,
  leaderboardEntries,
  onLeaderboardChange,
}: GameOverScreenProps): React.ReactElement {
  const roundsSurvived = round - 1;

  const handleClear = () => {
    clearLeaderboard();
    onLeaderboardChange([]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 p-4">
      <div className="bg-white/95 rounded-2xl p-6 shadow-2xl max-w-[95vw] max-h-[90vh] overflow-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Game Over Info */}
          <div className="text-center flex-shrink-0">
            <h2
              className="text-3xl md:text-4xl font-black mb-2"
              style={{ color: "#c44" }}
            >
              GAME OVER!
            </h2>
            <p className="text-lg mb-1" style={{ color: COLORS.textPrimary }}>
              You rolled {lastRollTotal} (divisible by 7)
            </p>
            <p
              className="text-xl md:text-2xl font-bold mb-2"
              style={{ color: COLORS.textPrimary }}
            >
              Final Score: {totalScore}
            </p>
            <p
              className="text-base mb-4"
              style={{ color: COLORS.textSecondary }}
            >
              You survived {roundsSurvived} round
              {roundsSurvived !== 1 ? "s" : ""}!
            </p>
            <button
              onClick={onPlayAgain}
              className="text-xl md:text-2xl font-black px-6 md:px-8 py-2 md:py-3 rounded-full transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: COLORS.textPrimary,
                color: COLORS.backgroundCss,
              }}
            >
              PLAY AGAIN
            </button>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px bg-gray-300" />
          <div className="md:hidden h-px bg-gray-300" />

          {/* Leaderboard */}
          <div className="text-center min-w-[200px]">
            <h3
              className="text-xl font-black mb-3"
              style={{ color: COLORS.textPrimary }}
            >
              🏆 Leaderboard
            </h3>
            {leaderboardEntries.length === 0 ? (
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                No scores yet!
              </p>
            ) : (
              <div className="max-h-[30vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: COLORS.textSecondary }}>
                      <th className="pb-1 text-center">#</th>
                      <th className="pb-1 text-right">Score</th>
                      <th className="pb-1 text-right">Rnds</th>
                      <th className="pb-1 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardEntries.map((entry, i) => (
                      <tr
                        key={i}
                        className={highlightIndex === i ? "bg-yellow-100" : ""}
                        style={{ color: COLORS.textPrimary }}
                      >
                        <td className="py-0.5 text-center font-bold">
                          {i + 1}
                        </td>
                        <td className="py-0.5 text-right font-mono">
                          {entry.score}
                        </td>
                        <td className="py-0.5 text-right">{entry.rounds}</td>
                        <td
                          className="py-0.5 text-right text-xs"
                          style={{ color: COLORS.textTertiary }}
                        >
                          {formatDate(entry.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {leaderboardEntries.length > 0 && (
              <button
                onClick={handleClear}
                className="mt-2 px-3 py-1 rounded-full font-bold text-xs transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: "#c44", color: "#fff" }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

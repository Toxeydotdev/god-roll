import React, { useState } from "react";
import { ColorTheme } from "../colorThemes";
import {
  clearLeaderboard,
  getLeaderboard,
  LeaderboardEntry,
} from "../leaderboard";

interface LeaderboardProps {
  onClose: () => void;
  highlightIndex?: number; // Index of the newly added entry to highlight
  theme: ColorTheme;
}

export function Leaderboard({
  onClose,
  highlightIndex,
  theme,
}: LeaderboardProps): React.ReactElement {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() =>
    getLeaderboard()
  );

  const handleClear = () => {
    clearLeaderboard();
    setEntries([]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60">
      <div className="bg-white/95 rounded-2xl p-6 text-center shadow-2xl min-w-[300px] max-w-[90vw]">
        <h2
          className="text-2xl font-black mb-4"
          style={{ color: theme.textPrimary }}
        >
          🏆 Leaderboard
        </h2>
        {entries.length === 0 ? (
          <p className="mb-4 text-lg" style={{ color: theme.textSecondary }}>
            No scores yet. Play a game!
          </p>
        ) : (
          <div className="mb-4 max-h-[50vh] overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ color: theme.textSecondary }}>
                  <th className="pb-2 text-center">#</th>
                  <th className="pb-2 text-right">Score</th>
                  <th className="pb-2 text-right">Rounds</th>
                  <th className="pb-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr
                    key={i}
                    className={highlightIndex === i ? "bg-yellow-100" : ""}
                    style={{ color: theme.textPrimary }}
                  >
                    <td className="py-1 text-center font-bold">{i + 1}</td>
                    <td className="py-1 text-right font-mono">{entry.score}</td>
                    <td className="py-1 text-right">{entry.rounds}</td>
                    <td
                      className="py-1 text-right text-sm"
                      style={{ color: theme.textTertiary }}
                    >
                      {formatDate(entry.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full font-bold text-base transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: theme.textPrimary,
              color: theme.backgroundCss,
            }}
          >
            Close
          </button>
          {entries.length > 0 && (
            <button
              onClick={handleClear}
              className="px-5 py-2 rounded-full font-bold text-base transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: "#c44", color: "#fff" }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

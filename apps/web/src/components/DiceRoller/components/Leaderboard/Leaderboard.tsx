import { ColorTheme } from "@/components/DiceRoller/colorThemes";
import {
  clearLeaderboard,
  getLeaderboard,
  LeaderboardEntry,
} from "@/components/DiceRoller/leaderboard";
import { LeaderboardEntry as GlobalLeaderboardEntry } from "@/lib/database.types";
import {
  getLeaderboard as getGlobalLeaderboard,
  isOnlineAvailable,
} from "@/lib/leaderboardService";
import React, { useEffect, useRef, useState } from "react";

type LeaderboardTab = "local" | "global";

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
  const onlineAvailable = isOnlineAvailable();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("local");
  const [globalEntries, setGlobalEntries] = useState<GlobalLeaderboardEntry[]>(
    []
  );
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
  const [clearProgress, setClearProgress] = useState(0);
  const clearTimerRef = useRef<number | null>(null);

  // Load global leaderboard when tab changes to global
  useEffect(() => {
    if (activeTab === "global") {
      setIsLoadingGlobal(true);
      getGlobalLeaderboard(10)
        .then(setGlobalEntries)
        .finally(() => setIsLoadingGlobal(false));
    }
  }, [activeTab]);

  const handleClearStart = () => {
    setClearProgress(0);
    const startTime = Date.now();
    const holdDuration = 1000; // 1 second hold

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / holdDuration, 1);
      setClearProgress(progress);

      if (progress >= 1) {
        // Clear completed
        clearLeaderboard();
        setEntries([]);
        setClearProgress(0);
      } else {
        clearTimerRef.current = window.setTimeout(updateProgress, 16);
      }
    };

    clearTimerRef.current = window.setTimeout(updateProgress, 16);
  };

  const handleClearEnd = () => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    setClearProgress(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-30 bg-black/60"
      style={{ touchAction: "none" }}
      onClick={onClose}
    >
      <div
        className="bg-white/95 rounded-t-3xl sm:rounded-2xl p-6 pt-3 text-center shadow-2xl w-full sm:w-auto sm:min-w-[300px] sm:max-w-[90vw] max-h-[85vh] flex flex-col"
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
            🏆 Leaderboard
          </h2>
          <button
            onClick={onClose}
            className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center text-lg hover:bg-black/10 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-1 mb-4">
          <button
            onClick={() => setActiveTab("local")}
            className="px-3 py-1 rounded-full text-sm font-bold transition-all"
            style={{
              backgroundColor:
                activeTab === "local" ? theme.textPrimary : "transparent",
              color:
                activeTab === "local"
                  ? theme.backgroundCss
                  : theme.textSecondary,
              border: `2px solid ${theme.textPrimary}`,
            }}
          >
            Local
          </button>
          <button
            onClick={() => onlineAvailable && setActiveTab("global")}
            disabled={!onlineAvailable}
            className="px-3 py-1 rounded-full text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor:
                activeTab === "global" ? theme.textPrimary : "transparent",
              color:
                activeTab === "global"
                  ? theme.backgroundCss
                  : theme.textSecondary,
              border: `2px solid ${theme.textPrimary}`,
            }}
            title={
              !onlineAvailable ? "Online features not configured" : undefined
            }
          >
            Global
          </button>
        </div>

        {/* Local Leaderboard */}
        {activeTab === "local" && (
          <>
            {entries.length === 0 ? (
              <p
                className="mb-4 text-lg"
                style={{ color: theme.textSecondary }}
              >
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
                        <td className="py-1 text-right font-mono">
                          {entry.score}
                        </td>
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
          </>
        )}

        {/* Global Leaderboard */}
        {activeTab === "global" && (
          <div className="mb-4">
            {isLoadingGlobal ? (
              <p
                className="text-lg py-4"
                style={{ color: theme.textSecondary }}
              >
                Loading...
              </p>
            ) : globalEntries.length === 0 ? (
              <p className="text-lg" style={{ color: theme.textSecondary }}>
                No global scores yet! Be the first!
              </p>
            ) : (
              <div className="max-h-[50vh] overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ color: theme.textSecondary }}>
                      <th className="pb-2 text-center">#</th>
                      <th className="pb-2 text-left">Player</th>
                      <th className="pb-2 text-right">Score</th>
                      <th className="pb-2 text-right">Rnds</th>
                      <th className="pb-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalEntries.map((entry, i) => (
                      <tr key={entry.id} style={{ color: theme.textPrimary }}>
                        <td className="py-1 text-center font-bold">{i + 1}</td>
                        <td className="py-1 text-left truncate max-w-[100px]">
                          {entry.player_name}
                        </td>
                        <td className="py-1 text-right font-mono">
                          {entry.score}
                        </td>
                        <td className="py-1 text-right">
                          {entry.rounds_survived}
                        </td>
                        <td
                          className="py-1 text-right text-sm"
                          style={{ color: theme.textTertiary }}
                        >
                          {formatDate(entry.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {activeTab === "local" && entries.length > 0 && (
            <button
              onMouseDown={handleClearStart}
              onMouseUp={handleClearEnd}
              onMouseLeave={handleClearEnd}
              onTouchStart={(e) => {
                e.preventDefault();
                handleClearStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleClearEnd();
              }}
              className="px-5 py-2 rounded-full font-bold text-base transition-all hover:scale-105 active:scale-95 relative overflow-hidden"
              style={{
                backgroundColor: "#c44",
                color: "#fff",
                opacity: 0.7 + clearProgress * 0.3,
              }}
              title="Hold to clear all scores"
            >
              {/* Progress indicator */}
              {clearProgress > 0 && (
                <span
                  className="absolute inset-0 bg-red-800 transition-none"
                  style={{
                    width: `${clearProgress * 100}%`,
                    opacity: 0.5,
                  }}
                />
              )}
              <span className="relative z-10">
                {clearProgress > 0 ? "Hold..." : "Clear All"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

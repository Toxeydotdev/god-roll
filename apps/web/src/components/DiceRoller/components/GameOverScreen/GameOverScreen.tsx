import { useOnlineMode, useTheme } from "@/components/DiceRoller/context";
import {
  clearLeaderboard,
  LeaderboardEntry,
} from "@/components/DiceRoller/leaderboard";
import { LeaderboardEntry as GlobalLeaderboardEntry } from "@/lib/database.types";
import {
  getLeaderboard as getGlobalLeaderboard,
  isOnlineAvailable,
  submitScore,
} from "@/lib/leaderboardService";
import React, { useEffect, useState } from "react";

type LeaderboardTab = "local" | "global";

interface GameOverScreenProps {
  lastRollTotal: number;
  totalScore: number;
  round: number;
  onPlayAgain: () => void;
  highlightIndex?: number;
  leaderboardEntries: LeaderboardEntry[];
  onLeaderboardChange: (entries: LeaderboardEntry[]) => void;
  sessionId: string;
}

export function GameOverScreen({
  lastRollTotal,
  totalScore,
  round,
  onPlayAgain,
  highlightIndex,
  leaderboardEntries,
  onLeaderboardChange,
  sessionId,
}: GameOverScreenProps): React.ReactElement {
  const { theme } = useTheme();
  const { isOnlineMode, playerName, setPlayerName } = useOnlineMode();
  const roundsSurvived = round - 1;
  const onlineAvailable = isOnlineAvailable();

  const [activeTab, setActiveTab] = useState<LeaderboardTab>(
    isOnlineMode && onlineAvailable ? "global" : "local"
  );
  const [globalEntries, setGlobalEntries] = useState<GlobalLeaderboardEntry[]>(
    []
  );
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    rank?: number;
  } | null>(null);
  const [nameInput, setNameInput] = useState(playerName);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Load global leaderboard when tab changes to global
  useEffect(() => {
    if (activeTab === "global") {
      setIsLoadingGlobal(true);
      getGlobalLeaderboard(10)
        .then(setGlobalEntries)
        .finally(() => setIsLoadingGlobal(false));
    }
  }, [activeTab]);

  const handleSubmitScore = async () => {
    if (!nameInput.trim() || hasSubmitted) return;

    setIsSubmitting(true);
    setPlayerName(nameInput.trim());

    const result = await submitScore(
      nameInput.trim(),
      totalScore,
      roundsSurvived,
      sessionId
    );

    setSubmitResult(result);
    setHasSubmitted(true);
    setIsSubmitting(false);

    // Refresh global leaderboard after submission
    if (result.success) {
      const updated = await getGlobalLeaderboard(10);
      setGlobalEntries(updated);
    }
  };

  const handleClear = () => {
    clearLeaderboard();
    onLeaderboardChange([]);
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
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 p-4">
      <div className="bg-white/95 rounded-2xl p-6 shadow-2xl max-w-[95vw] max-h-[90vh] overflow-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Game Over Info */}
          <div className="text-center flex-shrink-0">
            <h2
              className="text-3xl md:text-4xl mb-2"
              style={{
                color: "#c44",
                fontFamily: "var(--font-display)",
                textShadow: "3px 3px 0px rgba(0,0,0,0.15)",
                letterSpacing: "0.05em",
              }}
            >
              GAME OVER!
            </h2>
            <p
              className="text-lg mb-1"
              style={{
                color: theme.textPrimary,
                fontWeight: 600,
              }}
            >
              You rolled {lastRollTotal} (divisible by 7)
            </p>
            <p
              className="text-xl md:text-2xl mb-2"
              style={{
                color: theme.textPrimary,
                fontFamily: "var(--font-display)",
                letterSpacing: "0.05em",
              }}
            >
              Final Score: {totalScore}
            </p>
            <p
              className="text-base mb-4"
              style={{
                color: theme.textSecondary,
                fontWeight: 600,
              }}
            >
              You survived {roundsSurvived} round
              {roundsSurvived !== 1 ? "s" : ""}!
            </p>
            <button
              onClick={onPlayAgain}
              className="text-xl md:text-2xl px-6 md:px-8 py-2 md:py-3 rounded-full transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: theme.textPrimary,
                color: theme.backgroundCss,
                fontFamily: "var(--font-display)",
                textShadow: "2px 2px 0px rgba(0,0,0,0.3)",
                boxShadow: "0 4px 0 rgba(0,0,0,0.2)",
                letterSpacing: "0.05em",
              }}
            >
              PLAY AGAIN
            </button>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px bg-gray-300" />
          <div className="md:hidden h-px bg-gray-300" />

          {/* Leaderboard */}
          <div className="text-center min-w-[250px]">
            <h3
              className="text-xl font-black mb-2"
              style={{ color: theme.textPrimary }}
            >
              🏆 Leaderboard
            </h3>

            {/* Tabs */}
            <div className="flex justify-center gap-1 mb-3">
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
                  !onlineAvailable
                    ? "Online features not configured"
                    : undefined
                }
              >
                Global
              </button>
            </div>

            {/* Local Leaderboard */}
            {activeTab === "local" && (
              <>
                {leaderboardEntries.length === 0 ? (
                  <p className="text-sm" style={{ color: theme.textSecondary }}>
                    No local scores yet!
                  </p>
                ) : (
                  <div className="max-h-[30vh] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ color: theme.textSecondary }}>
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
                            className={
                              highlightIndex === i ? "bg-yellow-100" : ""
                            }
                            style={{ color: theme.textPrimary }}
                          >
                            <td className="py-0.5 text-center font-bold">
                              {i + 1}
                            </td>
                            <td className="py-0.5 text-right font-mono">
                              {entry.score}
                            </td>
                            <td className="py-0.5 text-right">
                              {entry.rounds}
                            </td>
                            <td
                              className="py-0.5 text-right text-xs"
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
                {leaderboardEntries.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="mt-2 px-3 py-1 rounded-full font-bold text-xs transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: "#c44", color: "#fff" }}
                  >
                    Clear All
                  </button>
                )}
              </>
            )}

            {/* Global Leaderboard */}
            {activeTab === "global" && (
              <div>
                {/* Submit Score Form */}
                {!hasSubmitted && totalScore > 0 && (
                  <div className="mb-3 p-3 rounded-lg bg-gray-100">
                    <p
                      className="text-sm mb-2"
                      style={{ color: theme.textSecondary }}
                    >
                      Submit your score to the global leaderboard!
                    </p>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      maxLength={20}
                      className="w-full px-3 py-1.5 rounded-lg border text-sm mb-2"
                      style={{
                        borderColor: theme.textSecondary,
                        color: theme.textPrimary,
                      }}
                    />
                    <button
                      onClick={handleSubmitScore}
                      disabled={!nameInput.trim() || isSubmitting}
                      className="px-4 py-1.5 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: theme.textPrimary,
                        color: theme.backgroundCss,
                      }}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Score"}
                    </button>
                  </div>
                )}

                {/* Submit Result */}
                {submitResult && (
                  <div
                    className="mb-3 p-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: submitResult.success
                        ? "#d4edda"
                        : "#f8d7da",
                      color: submitResult.success ? "#155724" : "#721c24",
                    }}
                  >
                    {submitResult.message}
                    {submitResult.rank && (
                      <span className="font-bold">
                        {" "}
                        Rank: #{submitResult.rank}
                      </span>
                    )}
                  </div>
                )}

                {/* Global Scores Table */}
                {isLoadingGlobal ? (
                  <p
                    className="text-sm py-4"
                    style={{ color: theme.textSecondary }}
                  >
                    Loading...
                  </p>
                ) : globalEntries.length === 0 ? (
                  <p className="text-sm" style={{ color: theme.textSecondary }}>
                    No global scores yet! Be the first!
                  </p>
                ) : (
                  <div className="max-h-[25vh] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ color: theme.textSecondary }}>
                          <th className="pb-1 text-center">#</th>
                          <th className="pb-1 text-left">Player</th>
                          <th className="pb-1 text-right">Score</th>
                          <th className="pb-1 text-right">Rnds</th>
                          <th className="pb-1 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {globalEntries.map((entry, i) => (
                          <tr
                            key={entry.id}
                            style={{ color: theme.textPrimary }}
                          >
                            <td className="py-0.5 text-center font-bold">
                              {i + 1}
                            </td>
                            <td className="py-0.5 text-left truncate max-w-[100px]">
                              {entry.player_name}
                            </td>
                            <td className="py-0.5 text-right font-mono">
                              {entry.score}
                            </td>
                            <td className="py-0.5 text-right">
                              {entry.rounds_survived}
                            </td>
                            <td
                              className="py-0.5 text-right text-xs"
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
          </div>
        </div>
      </div>
    </div>
  );
}

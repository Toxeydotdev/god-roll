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

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
    };
  }, []);

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
    <div
      className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 p-4 fade-in"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        touchAction: "none",
      }}
      onTouchMove={(e) => e.preventDefault()}
    >
      <div
        className="rounded-2xl p-6 shadow-2xl max-w-[95vw] max-h-[90vh] overflow-auto slide-up"
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,245,245,0.98) 100%)`,
          boxShadow: `0 25px 50px rgba(0,0,0,0.3), 0 0 60px ${theme.buttonGlow}`,
          overscrollBehavior: "contain",
          touchAction: "pan-y",
        }}
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Game Over Info */}
          <div className="text-center flex-shrink-0">
            <h2
              className="text-3xl md:text-4xl mb-2 shake"
              style={{
                color: theme.dangerColor,
                fontFamily: "var(--font-display)",
                textShadow: `3px 3px 0px rgba(0,0,0,0.15), 0 0 20px ${theme.dangerColor}40`,
                letterSpacing: "0.05em",
              }}
            >
              💀 GAME OVER!
            </h2>
            <p
              className="text-lg mb-1"
              style={{
                color: theme.textPrimary,
                fontWeight: 600,
              }}
            >
              You rolled{" "}
              <span style={{ color: theme.dangerColor, fontWeight: 700 }}>
                {lastRollTotal}
              </span>{" "}
              (divisible by 7)
            </p>
            <div
              className="my-4 py-3 px-6 rounded-xl inline-block pop-in"
              style={{
                background: `linear-gradient(145deg, ${theme.accentColor}20 0%, ${theme.accentColor}10 100%)`,
                border: `2px solid ${theme.accentColor}40`,
              }}
            >
              <p
                className="text-4xl md:text-5xl mb-1"
                style={{
                  color: theme.textPrimary,
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.05em",
                  textShadow: `2px 2px 0 rgba(0,0,0,0.1)`,
                }}
              >
                {totalScore}
              </p>
              <p
                className="text-sm"
                style={{
                  color: theme.textSecondary,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Final Score
              </p>
            </div>
            <p
              className="text-base mb-4"
              style={{
                color: theme.textSecondary,
                fontWeight: 600,
              }}
            >
              🔁 Survived {roundsSurvived} round
              {roundsSurvived !== 1 ? "s" : ""} • 🎲 Max {roundsSurvived} dice
            </p>
            <button
              onClick={onPlayAgain}
              className="text-xl md:text-2xl px-8 md:px-10 py-3 md:py-4 rounded-full transition-all hover:scale-105 active:scale-95 roll-button-idle"
              style={{
                backgroundColor: theme.accentColor,
                color: theme.backgroundCss,
                fontFamily: "var(--font-display)",
                textShadow: "2px 2px 0px rgba(0,0,0,0.3)",
                ["--button-shadow" as string]: `0 5px 0 ${theme.accentHover}, 0 8px 20px rgba(0,0,0,0.25)`,
                ["--glow-color" as string]: theme.buttonGlow,
                boxShadow: `0 5px 0 ${theme.accentHover}, 0 8px 20px rgba(0,0,0,0.25), 0 0 20px ${theme.buttonGlow}`,
                letterSpacing: "0.08em",
                border: `3px solid ${theme.accentHover}`,
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

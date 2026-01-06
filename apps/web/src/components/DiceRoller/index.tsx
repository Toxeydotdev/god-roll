import React, { useCallback, useEffect, useState } from "react";
import {
  ColorTheme,
  getSavedThemeId,
  getThemeById,
  saveThemeId,
} from "./colorThemes";
import {
  ColorPicker,
  GameOverScreen,
  GameRules,
  GameStats,
  GameTitle,
  Leaderboard,
  RollButton,
  StartScreen,
} from "./components";
import { useDicePhysics, useGameState, useThreeScene } from "./hooks";
import { addLeaderboardEntry } from "./leaderboard";

export function DiceRoller(): React.ReactElement {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [theme, setTheme] = useState<ColorTheme>(() =>
    getThemeById(getSavedThemeId())
  );
  const [highlightIndex, setHighlightIndex] = useState<number | undefined>(
    undefined
  );
  const [leaderboardEntries, setLeaderboardEntries] = useState<
    { score: number; rounds: number; date: string }[]
  >([]);

  const {
    containerRef,
    sceneRef,
    boundsRef,
    adjustCameraForDiceCount,
    resetCamera,
    setSceneBackground,
  } = useThreeScene();

  const {
    gameStarted,
    totalScore,
    round,
    gameOver,
    lastRollTotal,
    isRolling,
    results,
    setResults,
    handleRollStart,
    handleRollComplete,
    startGame: baseStartGame,
    startNewGame: baseStartNewGame,
  } = useGameState();

  const { isRollingRef, rollDice, clearAllDice } = useDicePhysics({
    sceneRef,
    boundsRef,
    onRollComplete: handleRollComplete,
    onResultsUpdate: setResults,
    onDiceCountChange: adjustCameraForDiceCount,
  });

  const handleRoll = useCallback(() => {
    if (isRollingRef.current) return;
    handleRollStart();
    rollDice();
  }, [handleRollStart, rollDice, isRollingRef]);

  const startGame = useCallback(() => {
    clearAllDice();
    resetCamera();
    baseStartGame();
  }, [clearAllDice, baseStartGame, resetCamera]);

  const startNewGame = useCallback(() => {
    clearAllDice();
    resetCamera();
    baseStartNewGame();
    setHighlightIndex(undefined);
  }, [clearAllDice, baseStartNewGame, resetCamera]);

  // Save score to leaderboard when game ends
  useEffect(() => {
    if (gameOver && totalScore > 0) {
      const newEntries = addLeaderboardEntry({
        score: totalScore,
        rounds: round - 1,
        date: new Date().toISOString(),
      });
      // Find the index of the newly added entry
      const idx = newEntries.findIndex(
        (e) => e.score === totalScore && e.rounds === round - 1
      );
      setHighlightIndex(idx >= 0 ? idx : undefined);
      setLeaderboardEntries(newEntries);
      // Don't auto-show, let user see game over screen first
    }
  }, [gameOver, totalScore, round]);

  // Handle theme change
  const handleThemeChange = useCallback(
    (newTheme: ColorTheme) => {
      setTheme(newTheme);
      saveThemeId(newTheme.id);
      setSceneBackground(newTheme.background);
    },
    [setSceneBackground]
  );

  // Update scene background when theme loads
  useEffect(() => {
    setSceneBackground(theme.background);
  }, [theme.background, setSceneBackground]);

  return (
    <div
      className="relative w-full h-dvh overflow-hidden touch-none"
      style={{ backgroundColor: theme.backgroundCss }}
    >
      <GameTitle theme={theme} />

      {gameStarted && (
        <GameStats
          totalScore={totalScore}
          round={round}
          onReset={startNewGame}
          onShowLeaderboard={() => {
            setHighlightIndex(undefined);
            setShowLeaderboard(true);
          }}
          onShowRules={() => setShowRules(true)}
          onShowColorPicker={() => setShowColorPicker(true)}
          theme={theme}
        />
      )}

      <div ref={containerRef} className="w-full h-full" />

      {!gameStarted && (
        <StartScreen
          onStartGame={startGame}
          onShowColorPicker={() => setShowColorPicker(true)}
          theme={theme}
        />
      )}

      {gameOver && (
        <GameOverScreen
          lastRollTotal={lastRollTotal}
          totalScore={totalScore}
          round={round}
          onPlayAgain={startNewGame}
          highlightIndex={highlightIndex}
          leaderboardEntries={leaderboardEntries}
          onLeaderboardChange={setLeaderboardEntries}
          theme={theme}
        />
      )}

      {gameStarted && !gameOver && (
        <RollButton
          results={results}
          lastRollTotal={lastRollTotal}
          isRolling={isRolling}
          onRoll={handleRoll}
          theme={theme}
        />
      )}

      {/* Leaderboard button */}
      {!gameStarted && (
        <button
          onClick={() => {
            setHighlightIndex(undefined);
            setShowLeaderboard(true);
          }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: theme.textSecondary,
            color: theme.backgroundCss,
          }}
        >
          🏆 Leaderboard
        </button>
      )}

      {/* Leaderboard modal */}
      {showLeaderboard && (
        <Leaderboard
          onClose={() => setShowLeaderboard(false)}
          highlightIndex={highlightIndex}
          theme={theme}
        />
      )}

      {/* Game Rules modal */}
      {showRules && (
        <GameRules onClose={() => setShowRules(false)} theme={theme} />
      )}

      {/* Color Picker modal */}
      {showColorPicker && (
        <ColorPicker
          currentTheme={theme}
          onSelectTheme={handleThemeChange}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
}

export default DiceRoller;

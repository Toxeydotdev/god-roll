import React, { useCallback } from "react";
import {
  GameOverScreen,
  GameStats,
  GameTitle,
  RollButton,
  StartScreen,
} from "./components";
import { COLORS } from "./constants";
import { useDicePhysics, useGameState, useThreeScene } from "./hooks";

export function DiceRoller(): React.ReactElement {
  const { containerRef, sceneRef, boundsRef } = useThreeScene();

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
  });

  const handleRoll = useCallback(() => {
    if (isRollingRef.current) return;
    handleRollStart();
    rollDice();
  }, [handleRollStart, rollDice, isRollingRef]);

  const startGame = useCallback(() => {
    clearAllDice();
    baseStartGame();
  }, [clearAllDice, baseStartGame]);

  const startNewGame = useCallback(() => {
    clearAllDice();
    baseStartNewGame();
  }, [clearAllDice, baseStartNewGame]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: COLORS.backgroundCss }}
    >
      <GameTitle />

      {gameStarted && (
        <GameStats
          totalScore={totalScore}
          round={round}
          onReset={startNewGame}
        />
      )}

      <div ref={containerRef} className="w-full h-full" />

      {!gameStarted && <StartScreen onStartGame={startGame} />}

      {gameOver && (
        <GameOverScreen
          lastRollTotal={lastRollTotal}
          totalScore={totalScore}
          round={round}
          onPlayAgain={startNewGame}
        />
      )}

      {gameStarted && !gameOver && (
        <RollButton
          results={results}
          lastRollTotal={lastRollTotal}
          isRolling={isRolling}
          onRoll={handleRoll}
        />
      )}
    </div>
  );
}

export default DiceRoller;

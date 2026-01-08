import {
  ControlsPanel,
  GameOverScreen,
  GameTitle,
  RollButton,
  StartScreen,
} from "@/components/DiceRoller/components";
import {
  DiceSkinProvider,
  ModalProvider,
  OnlineModeProvider,
  SoundProvider,
  ThemeProvider,
  useDiceSkin,
  useSound,
  useTheme,
} from "@/components/DiceRoller/context";
import {
  SoundCallbacks,
  useDicePhysics,
  useGameState,
  useThreeScene,
} from "@/components/DiceRoller/hooks";
import { addLeaderboardEntry } from "@/components/DiceRoller/leaderboard";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export function DiceRoller(): React.ReactElement {
  return (
    <ThemeProvider>
      <SoundProvider>
        <DiceSkinProvider>
          <OnlineModeProvider>
            <ModalProvider>
              <DiceRollerContent />
            </ModalProvider>
          </OnlineModeProvider>
        </DiceSkinProvider>
      </SoundProvider>
    </ThemeProvider>
  );
}

function DiceRollerContent(): React.ReactElement {
  const [resetProgress, setResetProgress] = useState<number>(0);
  const resetTimerRef = useRef<number | null>(null);
  const [highlightIndex, setHighlightIndex] = useState<number | undefined>(
    undefined
  );
  const [leaderboardEntries, setLeaderboardEntries] = useState<
    { score: number; rounds: number; date: string }[]
  >([]);
  // Session ID for this game instance (prevents duplicate score submissions)
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());

  const { theme } = useTheme();
  const { playDiceHit } = useSound();
  const { skinId } = useDiceSkin();

  const {
    containerRef,
    sceneRef,
    boundsRef,
    adjustCameraForDiceCount,
    resetCamera,
    setSceneBackground,
  } = useThreeScene();

  // Memoize sound callbacks to avoid recreating on every render
  const soundCallbacks: SoundCallbacks = useMemo(
    () => ({
      onFloorHit: (velocity: number) => playDiceHit(velocity),
    }),
    [playDiceHit]
  );

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

  const { isRollingRef, rollDice, clearAllDice, updateAllDiceSkins } =
    useDicePhysics({
      sceneRef,
      boundsRef,
      onRollComplete: handleRollComplete,
      onResultsUpdate: setResults,
      onDiceCountChange: adjustCameraForDiceCount,
      soundCallbacks,
      skinId,
    });

  // Update existing dice when skin changes
  useEffect(() => {
    updateAllDiceSkins(skinId);
  }, [skinId, updateAllDiceSkins]);

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
    setSessionId(crypto.randomUUID()); // New session for new game
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

  // Helper functions for reset button
  const handleResetStart = useCallback(
    (
      onReset: () => void,
      setProgress: (p: number) => void,
      timerRef: React.MutableRefObject<number | null>
    ) => {
      const startTime = Date.now();
      const holdDuration = 1000;

      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / holdDuration, 1);
        setProgress(progress);

        if (progress >= 1) {
          onReset();
          setProgress(0);
        } else {
          timerRef.current = requestAnimationFrame(tick);
        }
      };

      timerRef.current = requestAnimationFrame(tick);
    },
    []
  );

  const handleResetEnd = useCallback(
    (
      setProgress: (p: number) => void,
      timerRef: React.MutableRefObject<number | null>
    ) => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      setProgress(0);
    },
    []
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
      <GameTitle />

      {/* Controls panel - collapsible menu with sound, theme, rules, leaderboard */}
      {gameStarted && <ControlsPanel />}

      {/* Score display during game */}
      {gameStarted && (
        <div className="absolute top-4 right-4 z-0 text-right">
          <div
            className="text-2xl"
            data-testid="score-display"
            style={{
              color: theme.textPrimary,
              fontFamily: "var(--font-display)",
              textShadow: "2px 2px 0px rgba(0,0,0,0.15)",
              letterSpacing: "0.05em",
            }}
          >
            SCORE: {totalScore}
          </div>
          <div
            className="text-lg"
            data-testid="round-display"
            style={{
              color: theme.textSecondary,
              fontWeight: 600,
            }}
          >
            Round {round}
          </div>
          {/* Reset button */}
          <button
            onMouseDown={() =>
              handleResetStart(startNewGame, setResetProgress, resetTimerRef)
            }
            onMouseUp={() => handleResetEnd(setResetProgress, resetTimerRef)}
            onMouseLeave={() => handleResetEnd(setResetProgress, resetTimerRef)}
            onTouchStart={(e) => {
              e.preventDefault();
              handleResetStart(startNewGame, setResetProgress, resetTimerRef);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleResetEnd(setResetProgress, resetTimerRef);
            }}
            className="text-sm px-3 py-1 rounded-full transition-all hover:scale-105 active:scale-95 mt-1 block mx-auto"
            data-testid="reset-button"
            style={{
              backgroundColor: theme.textSecondary,
              color: theme.backgroundCss,
              opacity: 0.7 + resetProgress * 0.3,
              fontWeight: 600,
              boxShadow: "0 2px 0 rgba(0,0,0,0.2)",
            }}
            title="Hold to reset game"
          >
            {resetProgress > 0 ? "HOLD..." : "Hold to Reset"}
          </button>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />

      {!gameStarted && <StartScreen onStartGame={startGame} />}

      {gameOver && (
        <GameOverScreen
          lastRollTotal={lastRollTotal}
          totalScore={totalScore}
          round={round}
          onPlayAgain={startNewGame}
          highlightIndex={highlightIndex}
          leaderboardEntries={leaderboardEntries}
          onLeaderboardChange={setLeaderboardEntries}
          sessionId={sessionId}
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

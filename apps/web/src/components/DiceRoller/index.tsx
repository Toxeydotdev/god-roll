import {
  ControlsPanel,
  GameOverScreen,
  GameTitle,
  RollButton,
  RoundCompleteBanner,
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
  useScreenOrientation,
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

  // Lock screen orientation on mobile devices
  useScreenOrientation();

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
      style={{ background: theme.backgroundGradient }}
    >
      {/* Subtle texture overlay for depth */}
      <div className="texture-overlay" />

      {/* 3D Canvas - fills entire screen */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* UI Layer - overlays on top of canvas */}
      <div className="absolute inset-0 pointer-events-none flex flex-col">
        {/* Header area - title and score */}
        <header
          className="flex-none flex justify-between items-start p-4 pointer-events-auto"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
        >
          <GameTitle />

          {/* Score display during game - enhanced hierarchy */}
          {gameStarted ? (
            <div className="text-right">
              {/* Round is primary - larger and more prominent */}
              <div
                className="text-3xl mb-1"
                data-testid="round-display"
                style={{
                  color: theme.textPrimary,
                  fontFamily: "var(--font-display)",
                  textShadow: "3px 3px 0px rgba(0,0,0,0.15)",
                  letterSpacing: "0.05em",
                }}
              >
                ROUND {round}
              </div>
              {/* Score is secondary */}
              <div
                className="text-xl"
                data-testid="score-display"
                style={{
                  color: theme.textSecondary,
                  fontWeight: 600,
                }}
              >
                <span style={{ fontSize: "0.9em", opacity: 0.8 }}>🏆</span>{" "}
                {totalScore}
              </div>
              {/* Dice count indicator */}
              <div
                className="text-sm mt-1 px-2 py-0.5 rounded-full inline-block"
                style={{
                  backgroundColor: "rgba(0,0,0,0.1)",
                  color: theme.textTertiary,
                  fontWeight: 600,
                }}
              >
                🎲 ×{round}
              </div>
              {/* Reset button */}
              <button
                onMouseDown={() =>
                  handleResetStart(
                    startNewGame,
                    setResetProgress,
                    resetTimerRef
                  )
                }
                onMouseUp={() =>
                  handleResetEnd(setResetProgress, resetTimerRef)
                }
                onMouseLeave={() =>
                  handleResetEnd(setResetProgress, resetTimerRef)
                }
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleResetStart(
                    startNewGame,
                    setResetProgress,
                    resetTimerRef
                  );
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleResetEnd(setResetProgress, resetTimerRef);
                }}
                className="text-sm px-3 py-1 rounded-full transition-all hover:scale-105 active:scale-95 mt-2 block ml-auto"
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
                {resetProgress > 0 ? "HOLD..." : "↺ Reset"}
              </button>
            </div>
          ) : (
            <div />
          )}
        </header>

        {/* Middle spacer - pushes footer to bottom */}
        <div className="flex-1">
          {/* Round complete celebration banner */}
          {gameStarted && (
            <RoundCompleteBanner
              round={round}
              lastScore={lastRollTotal}
              isRolling={isRolling}
              gameOver={gameOver}
            />
          )}
        </div>

        {/* Footer - Roll button and controls */}
        {gameStarted && !gameOver && (
          <footer className="flex-none flex flex-col items-center gap-3 pointer-events-auto">
            <RollButton
              results={results}
              lastRollTotal={lastRollTotal}
              isRolling={isRolling}
              onRoll={handleRoll}
            />
            <ControlsPanel />
          </footer>
        )}
      </div>

      {/* Start screen overlay */}
      {!gameStarted && <StartScreen onStartGame={startGame} />}

      {/* Game over overlay */}
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
    </div>
  );
}

export default DiceRoller;

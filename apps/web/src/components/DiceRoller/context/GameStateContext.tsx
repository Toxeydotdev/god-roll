/**
 * GameStateContext - Centralized game state management
 *
 * Provides game state (score, round, rolling, results) throughout the app
 * without prop drilling. Components can access game state via useGameState hook.
 */

import { DiceFaceNumber } from "@/components/DiceRoller/types";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

// ============================================================================
// TYPES
// ============================================================================

interface GameStateContextValue {
  // State
  gameStarted: boolean;
  totalScore: number;
  round: number;
  gameOver: boolean;
  lastRollTotal: number;
  isRolling: boolean;
  results: DiceFaceNumber[];

  // Actions
  setIsRolling: (rolling: boolean) => void;
  setResults: (results: DiceFaceNumber[]) => void;
  handleRollStart: () => void;
  handleRollComplete: (
    rollTotal: number,
    diceResults: DiceFaceNumber[]
  ) => void;
  startGame: () => void;
  startNewGame: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const GameStateContext = createContext<GameStateContextValue | undefined>(
  undefined
);

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * Initial state values for testing purposes.
 * In production, these are ignored and state starts fresh.
 */
export interface GameStateInitialValues {
  gameStarted?: boolean;
  totalScore?: number;
  round?: number;
  gameOver?: boolean;
  lastRollTotal?: number;
  isRolling?: boolean;
  results?: DiceFaceNumber[];
}

interface GameStateProviderProps {
  children: ReactNode;
  /** Initial values for testing - allows setting state for isolated component tests */
  initialValues?: GameStateInitialValues;
}

export function GameStateProvider({
  children,
  initialValues,
}: GameStateProviderProps): React.ReactElement {
  const [gameStarted, setGameStarted] = useState<boolean>(
    initialValues?.gameStarted ?? false
  );
  const [totalScore, setTotalScore] = useState<number>(
    initialValues?.totalScore ?? 0
  );
  const [round, setRound] = useState<number>(initialValues?.round ?? 1);
  const [gameOver, setGameOver] = useState<boolean>(
    initialValues?.gameOver ?? false
  );
  const [lastRollTotal, setLastRollTotal] = useState<number>(
    initialValues?.lastRollTotal ?? 0
  );
  const [isRolling, setIsRolling] = useState<boolean>(
    initialValues?.isRolling ?? false
  );
  const [results, setResults] = useState<DiceFaceNumber[]>(
    initialValues?.results ?? []
  );

  const handleRollStart = useCallback(() => {
    setRound((prev) => prev + 1);
    setIsRolling(true);
  }, []);

  const handleRollComplete = useCallback(
    (rollTotal: number, diceResults: DiceFaceNumber[]) => {
      setResults(diceResults);
      setLastRollTotal(rollTotal);

      if (rollTotal % 7 === 0) {
        setGameOver(true);
      } else {
        setTotalScore((prev) => prev + rollTotal);
      }

      setIsRolling(false);
    },
    []
  );

  const startGame = useCallback(() => {
    setGameStarted(true);
    setTotalScore(0);
    setRound(0);
    setGameOver(false);
    setResults([]);
    setLastRollTotal(0);
  }, []);

  const startNewGame = useCallback(() => {
    setTotalScore(0);
    setRound(0);
    setGameOver(false);
    setResults([]);
    setLastRollTotal(0);
  }, []);

  return (
    <GameStateContext.Provider
      value={{
        gameStarted,
        totalScore,
        round,
        gameOver,
        lastRollTotal,
        isRolling,
        results,
        setIsRolling,
        setResults,
        handleRollStart,
        handleRollComplete,
        startGame,
        startNewGame,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useGameState(): GameStateContextValue {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error("useGameState must be used within a GameStateProvider");
  }
  return context;
}

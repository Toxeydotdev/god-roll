import { useCallback, useState } from "react";
import { DiceFaceNumber } from "../types";

interface UseGameStateReturn {
  gameStarted: boolean;
  totalScore: number;
  round: number;
  gameOver: boolean;
  lastRollTotal: number;
  isRolling: boolean;
  results: DiceFaceNumber[];
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

export function useGameState(): UseGameStateReturn {
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [lastRollTotal, setLastRollTotal] = useState<number>(0);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [results, setResults] = useState<DiceFaceNumber[]>([]);

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

  return {
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
  };
}

import { createSignal, createRoot } from 'solid-js';

/**
 * Game state that persists across screens.
 * Created in a root to avoid disposal issues.
 *
 * Signals here are the DOM bridge — ECS resources are the source of truth.
 * bridgeEcsToSignals() populates these from ECS observations.
 */

export interface GameState {
  score: () => number;
  setScore: (score: number) => void;
  addScore: (amount: number) => void;

  level: () => number;
  setLevel: (level: number) => void;
  incrementLevel: () => void;

  /** Win/loss outcome for results screen */
  win: () => boolean;
  setWin: (win: boolean) => void;

  /** Stars earned (1–3) */
  stars: () => 1 | 2 | 3;
  setStars: (stars: 1 | 2 | 3) => void;

  /** Moves remaining at end of level */
  movesRemaining: () => number;
  setMovesRemaining: (moves: number) => void;

  /** Snacks remaining (for loss screen context) */
  snacksRemaining: () => number;
  setSnacksRemaining: (snacks: number) => void;

  /** Chapter name for display */
  chapterName: () => string;
  setChapterName: (name: string) => void;

  /** Full reset including level (returns to level 1). */
  reset: () => void;

  /**
   * Per-session reset: clears score/outcome/moves/snacks/chapter but
   * preserves the current level number so Next Level works correctly.
   */
  resetSession: () => void;
}

function createGameState(): GameState {
  const [score, setScore] = createSignal(0);
  const [level, setLevel] = createSignal(1);
  const [win, setWin] = createSignal(false);
  const [stars, setStars] = createSignal<1 | 2 | 3>(1);
  const [movesRemaining, setMovesRemaining] = createSignal(0);
  const [snacksRemaining, setSnacksRemaining] = createSignal(0);
  const [chapterName, setChapterName] = createSignal('');

  return {
    score,
    setScore,
    addScore: (amount: number) => setScore((s) => s + amount),

    level,
    setLevel,
    incrementLevel: () => setLevel((l) => l + 1),

    win,
    setWin,

    stars,
    setStars,

    movesRemaining,
    setMovesRemaining,

    snacksRemaining,
    setSnacksRemaining,

    chapterName,
    setChapterName,

    reset: () => {
      setScore(0);
      setLevel(1);
      setWin(false);
      setStars(1);
      setMovesRemaining(0);
      setSnacksRemaining(0);
      setChapterName('');
    },

    resetSession: () => {
      // Resets per-game state only; level is intentionally preserved.
      setScore(0);
      setWin(false);
      setStars(1);
      setMovesRemaining(0);
      setSnacksRemaining(0);
      setChapterName('');
    },
  };
}

export const gameState = createRoot(createGameState);

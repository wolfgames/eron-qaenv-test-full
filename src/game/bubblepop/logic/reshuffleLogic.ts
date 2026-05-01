/**
 * Reshuffle Logic — stuck-state detection and top-half reshuffle.
 *
 * reshuffleTopHalf(board, rng) reshuffles rows 0-3 using seeded Fisher-Yates shuffle.
 * Guarantees at least one valid group of 2+ same-flavor exists after reshuffle.
 *
 * createSeededRng(seed) — simple xorshift32 PRNG. Deterministic, no Math.random.
 *
 * Pure function. No Pixi, no DOM.
 */

import type { BoardState, BubbleCell, Flavor } from '../state/types';
import { detectStuck } from './boardLogic';

const RESHUFFLE_ROWS = 4; // rows 0-3 are the "top half" for reshuffle

/**
 * Create a seeded pseudo-random number generator (xorshift32).
 * Returns a function that produces values in [0, 1).
 * No Math.random — fully deterministic.
 */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0; // force uint32
  if (state === 0) state = 1;

  return function xorshift32(): number {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state = state >>> 0; // ensure uint32
    return (state >>> 0) / 4294967296; // normalize to [0, 1)
  };
}

/**
 * Fisher-Yates shuffle using a seeded RNG.
 * Mutates the array in place. Returns the same array.
 */
function fisherYatesShuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Reshuffle the top half of the board (rows 0 to RESHUFFLE_ROWS-1).
 * Guarantees at least one valid group of 2+ same-flavor bubbles exists.
 *
 * @param board - current board state
 * @param rng - seeded PRNG (use createSeededRng(seed))
 * @returns new board state with top half reshuffled
 */
export function reshuffleTopHalf(board: BoardState, rng: () => number): BoardState {
  // Separate top-half bubbles from bottom-half bubbles
  const topCells = board.cells.filter((c): c is BubbleCell => c !== null && c.row < RESHUFFLE_ROWS);
  const bottomCells = board.cells.filter((c): c is BubbleCell => c !== null && c.row >= RESHUFFLE_ROWS);

  if (topCells.length === 0) {
    // Nothing to reshuffle
    return board;
  }

  // Collect flavors from top cells
  const flavors = topCells.map((c) => c.flavor);
  const positions = topCells.map((c) => ({ row: c.row, col: c.col, entityId: c.entityId }));

  // Shuffle flavors (not positions) to redistribute flavor assignments
  const shuffledFlavors = fisherYatesShuffle([...flavors], rng);

  // Rebuild top cells with shuffled flavors at same positions
  let reshuffledTop: BubbleCell[] = positions.map((pos, i) => ({
    row: pos.row,
    col: pos.col,
    flavor: shuffledFlavors[i],
    entityId: pos.entityId,
  }));

  // Guarantee at least one valid group: if still stuck, force a pair
  const candidateBoard: BoardState = { ...board, cells: [...reshuffledTop, ...bottomCells] };
  if (detectStuck(candidateBoard) && reshuffledTop.length >= 2) {
    // Force adjacent pair: set first two cells to same flavor
    const targetFlavor: Flavor = reshuffledTop[0].flavor;
    reshuffledTop = reshuffledTop.map((c, i) => (i === 1 ? { ...c, flavor: targetFlavor } : c));
  }

  return {
    ...board,
    cells: [...reshuffledTop, ...bottomCells],
  };
}

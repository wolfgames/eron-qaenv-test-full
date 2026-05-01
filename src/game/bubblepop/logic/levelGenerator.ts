/**
 * Level Generator — procedural level generation for levels 6+.
 *
 * 5-step algorithm:
 *   1. seed = levelNumber * SEED_MULTIPLIER (73829), init seeded PRNG
 *   2. Parameterize difficulty by level (flavorCount, snackDepth, moveLimit)
 *   3. Place snack tiles in rows 6-8 (seeded positions)
 *   4. Fill bubbles using seeded flavor sampling
 *   5. Run solvabilityChecker — if fails, retry with seed+retryCount (max 10)
 *      Fallback: previous-level layout (snackCount-1, moveLimit+5)
 *
 * No Math.random — seeded PRNG only (xorshift32 from reshuffleLogic).
 *
 * Pure function. Returns a board schema compatible with hand-crafted-levels.json.
 */

import type { Flavor } from '../state/types';
import { createSeededRng } from './reshuffleLogic';
import { isSolvable } from './solvabilityChecker';
import type { BoardState, BubbleCell } from '../state/types';

export const SEED_MULTIPLIER = 73829;
const COLS = 7;
const ROWS = 9;
const MAX_RETRIES = 10;
const SNACK_ROW_MIN = 6;
const SNACK_ROWS = 3; // rows 6, 7, 8
const ALL_FLAVORS: Flavor[] = ['bone', 'pizza', 'burger', 'hotdog', 'sandwich'];

export interface GeneratedLevel {
  id: number;
  chapterIndex: number;
  cols: number;
  rows: number;
  moveLimit: number;
  snackCount: number;
  ghostCount: number;
  board: Array<{
    row: number;
    col: number;
    flavor: Flavor;
    entityId: string;
    isSnoopySnack: boolean;
  }>;
  snacks: Array<{ row: number; col: number; entityId: string; covered: boolean }>;
}

/**
 * Parameterize difficulty based on level number.
 */
function getDifficultyParams(levelNumber: number): {
  flavorCount: number;
  snackCount: number;
  moveLimit: number;
} {
  const normalized = Math.min(levelNumber - 6, 50); // cap at level 56 for difficulty curve

  const flavorCount = Math.min(3 + Math.floor(normalized / 10), ALL_FLAVORS.length);
  const snackCount = 3 + Math.floor(normalized / 15);
  const moveLimit = Math.max(15, 35 - Math.floor(normalized / 3));

  return { flavorCount, snackCount, moveLimit };
}

/**
 * Generate a single board attempt using the given seed.
 */
function generateBoardAttempt(
  levelNumber: number,
  seed: number,
  params: ReturnType<typeof getDifficultyParams>,
): GeneratedLevel {
  const rng = createSeededRng(seed);
  const { flavorCount, snackCount, moveLimit } = params;
  const flavors = ALL_FLAVORS.slice(0, flavorCount);

  // Place snack positions in rows 6-8 (seeded)
  const snackPositions: Array<{ row: number; col: number }> = [];
  const usedPositions = new Set<string>();

  let placed = 0;
  while (placed < snackCount) {
    const row = SNACK_ROW_MIN + Math.floor(rng() * SNACK_ROWS);
    const col = Math.floor(rng() * COLS);
    const key = `${row},${col}`;
    if (!usedPositions.has(key)) {
      usedPositions.add(key);
      snackPositions.push({ row, col });
      placed++;
    }
  }

  // Fill bubbles for all cells (seeded flavor sampling)
  const board: GeneratedLevel['board'] = [];
  const snackSet = new Set(snackPositions.map((p) => `${p.row},${p.col}`));

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const flavor = flavors[Math.floor(rng() * flavorCount)];
      const isSnoopySnack = snackSet.has(`${row},${col}`);
      board.push({
        row,
        col,
        flavor,
        entityId: `l${levelNumber}-r${row}c${col}`,
        isSnoopySnack,
      });
    }
  }

  const snacks = snackPositions.map((p, i) => ({
    row: p.row,
    col: p.col,
    entityId: `l${levelNumber}-snack${i}`,
    covered: true,
  }));

  const chapterIndex = Math.floor((levelNumber - 1) / 5);

  return {
    id: levelNumber,
    chapterIndex,
    cols: COLS,
    rows: ROWS,
    moveLimit,
    snackCount,
    ghostCount: 0,
    board,
    snacks,
  };
}

/**
 * Convert GeneratedLevel board to BoardState for solvability check.
 */
function toBoardState(level: GeneratedLevel): BoardState {
  return {
    cols: level.cols,
    rows: level.rows,
    cells: level.board.map((c) => ({
      row: c.row,
      col: c.col,
      flavor: c.flavor,
      entityId: c.entityId,
    })) as BubbleCell[],
    snacks: [],
  };
}

/**
 * Generate a level for the given levelNumber.
 * Deterministic: same input always produces same output.
 * Retries up to MAX_RETRIES with incremented seeds.
 * Falls back to a safe template if all retries fail.
 */
export function generateLevel(levelNumber: number): GeneratedLevel {
  const params = getDifficultyParams(levelNumber);
  const baseSeed = levelNumber * SEED_MULTIPLIER;

  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    const seed = baseSeed + retry;
    const level = generateBoardAttempt(levelNumber, seed, params);
    const board = toBoardState(level);

    const { isSolvable: solvable } = isSolvable(board, level.moveLimit);
    if (solvable) {
      return level;
    }
  }

  // Fallback: use previous-level layout with adjusted difficulty
  const fallbackParams = {
    flavorCount: Math.max(3, params.flavorCount - 1),
    snackCount: Math.max(1, params.snackCount - 1),
    moveLimit: params.moveLimit + 5,
  };
  return generateBoardAttempt(levelNumber, baseSeed, fallbackParams);
}

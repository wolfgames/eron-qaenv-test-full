/**
 * Snack Logic — pure functions for Scooby Snack tile collection.
 *
 * A Scooby Snack tile is "exposed" (auto-collectable) when:
 *   no bubble occupies a cell in the SAME COLUMN at a row ABOVE (< snack.row) the snack.
 *
 * This definition ensures a snack is only collected when the column above is clear.
 * Collection triggers immediately after every gravity settle.
 *
 * No Math.random. No Pixi. No DOM.
 */

import type { BoardState, SnackCell } from '../state/types';

/**
 * Check if a single snack tile is exposed (no bubble above it in its column).
 */
export function isSnackExposed(board: BoardState, snack: SnackCell): boolean {
  // A snack is exposed if no bubble exists in the same column at any row < snack.row
  const hasBubbleAbove = board.cells.some(
    (c) => c !== null && c.col === snack.col && c.row < snack.row,
  );
  return !hasBubbleAbove;
}

/**
 * Find all snack tiles that are currently exposed and should be auto-collected.
 * Returns only uncollected (covered) snacks that have become exposed.
 */
export function checkSnackCollection(board: BoardState): SnackCell[] {
  return board.snacks.filter(
    (snack) => snack.covered && isSnackExposed(board, snack),
  );
}

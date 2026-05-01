/**
 * Board Logic — top-level exports for game logic
 *
 * Re-exports and composes groupFinder, gravityFill, and detectStuck.
 * All functions are pure: no Math.random, no Pixi, no DOM.
 */

export { findConnectedGroup, getCellAt } from './groupFinder';
export { applyGravity, computeGravityDiff } from './gravityFill';

import type { BoardState, BubbleCell } from '../state/types';
import { findConnectedGroup } from './groupFinder';

/**
 * Detect if the board is stuck (no valid group of size >= 2 exists for any flavor).
 * Used after gravity settle to trigger reshuffle.
 *
 * Returns true if no group of 2+ same-flavor bubbles can be found anywhere on the board.
 */
export function detectStuck(board: BoardState): boolean {
  const visited = new Set<string>();

  for (const cell of board.cells) {
    if (cell === null) continue;
    const key = `${cell.row},${cell.col}`;
    if (visited.has(key)) continue;

    const group = findConnectedGroup(board, { row: cell.row, col: cell.col });
    for (const g of group) {
      visited.add(`${g.row},${g.col}`);
    }

    if (group.length >= 2) {
      return false; // Found a valid group — not stuck
    }
  }

  return true; // No group of 2+ found — stuck
}

/**
 * Remove a group of cells from the board.
 * Returns a new board with those cells removed.
 */
export function removeGroup(board: BoardState, group: BubbleCell[]): BoardState {
  const removedIds = new Set(group.map((c) => c.entityId));
  return {
    ...board,
    cells: board.cells.filter((c): c is BubbleCell => c !== null && !removedIds.has(c.entityId)),
  };
}

/**
 * Build a board from a flat cell array (from level data or ECS query).
 */
export function buildBoardFromCells(
  cols: number,
  rows: number,
  cells: BubbleCell[],
): BoardState {
  return { cols, rows, cells: [...cells], snacks: [] };
}

/**
 * Gravity Fill
 *
 * Applies downward gravity to a board — bubbles fall to the lowest available cell
 * in their column. Empty columns do NOT collapse horizontally.
 *
 * Returns: { after: BoardState, diffs: GravityDiff[] }
 *   - after: new board state with bubbles settled
 *   - diffs: list of moves for animation (only moved bubbles)
 *
 * Pure function: no Math.random, no Pixi, no DOM.
 */

import type { BoardState, BubbleCell, GravityDiff } from '../state/types';

export interface GravityResult {
  after: BoardState;
  diffs: GravityDiff[];
}

/**
 * Apply gravity: bubbles in each column fall to the lowest available row.
 * Columns are processed independently. Entity IDs are stable.
 */
export function applyGravity(board: BoardState): GravityResult {
  const { cols, rows } = board;
  const diffs: GravityDiff[] = [];
  const newCells: BubbleCell[] = [];

  for (let col = 0; col < cols; col++) {
    // Get all non-null bubbles in this column, sorted by row (top to bottom)
    const columnBubbles = board.cells
      .filter((c): c is BubbleCell => c !== null && c.col === col)
      .sort((a, b) => a.row - b.row);

    // Place bubbles starting from the bottom of the column
    let nextRow = rows - 1;
    for (let i = columnBubbles.length - 1; i >= 0; i--) {
      const bubble = columnBubbles[i];
      const newRow = nextRow;
      nextRow--;

      if (newRow !== bubble.row) {
        diffs.push({
          entityId: bubble.entityId,
          fromRow: bubble.row,
          toRow: newRow,
          col: bubble.col,
          distance: newRow - bubble.row,
        });
      }

      newCells.push({ ...bubble, row: newRow });
    }
  }

  return {
    after: { ...board, cells: newCells },
    diffs,
  };
}

/**
 * Compute gravity diff between before and after board states.
 * Used by BoardRenderer to know which sprites to animate.
 * Only includes entities whose position changed.
 */
export function computeGravityDiff(before: BoardState, after: BoardState): GravityDiff[] {
  const diffs: GravityDiff[] = [];
  const beforeMap = new Map<string, BubbleCell>();

  for (const cell of before.cells) {
    if (cell !== null) {
      beforeMap.set(cell.entityId, cell);
    }
  }

  for (const cell of after.cells) {
    if (cell === null) continue;
    const prev = beforeMap.get(cell.entityId);
    if (prev && (prev.row !== cell.row || prev.col !== cell.col)) {
      diffs.push({
        entityId: cell.entityId,
        fromRow: prev.row,
        toRow: cell.row,
        col: cell.col,
        distance: cell.row - prev.row,
      });
    }
  }

  return diffs;
}

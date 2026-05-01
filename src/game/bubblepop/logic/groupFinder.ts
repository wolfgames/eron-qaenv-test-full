/**
 * Group Finder — BFS connected component search
 *
 * Finds all cells connected to a given position that share the same flavor.
 * 4-directional connectivity (up/down/left/right). No diagonals.
 *
 * Pure function: no Math.random, no Pixi, no DOM.
 */

import type { BoardState, BubbleCell, CellPosition } from '../state/types';

/**
 * Find all BubbleCells connected to the cell at `pos` that share the same flavor.
 * Returns a group of 1 if the cell is a lone bubble or flavor-isolated.
 */
export function findConnectedGroup(board: BoardState, pos: CellPosition): BubbleCell[] {
  const { cols, rows } = board;
  const startCell = getCellAt(board, pos.row, pos.col);
  if (!startCell) return [];

  const targetFlavor = startCell.flavor;
  const visited = new Set<string>(); // "row,col"
  const group: BubbleCell[] = [];
  const queue: CellPosition[] = [pos];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.row},${current.col}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = getCellAt(board, current.row, current.col);
    if (!cell || cell.flavor !== targetFlavor) continue;

    group.push(cell);

    // Visit 4-directional neighbors
    const neighbors: CellPosition[] = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 },
    ];

    for (const neighbor of neighbors) {
      if (
        neighbor.row >= 0 &&
        neighbor.row < rows &&
        neighbor.col >= 0 &&
        neighbor.col < cols &&
        !visited.has(`${neighbor.row},${neighbor.col}`)
      ) {
        queue.push(neighbor);
      }
    }
  }

  return group;
}

/**
 * Get a BubbleCell at the given position, or null if empty.
 */
export function getCellAt(board: BoardState, row: number, col: number): BubbleCell | null {
  return board.cells.find((c) => c !== null && c.row === row && c.col === col) ?? null;
}

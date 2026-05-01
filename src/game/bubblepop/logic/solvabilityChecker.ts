/**
 * Solvability Checker — greedy simulation of optimal play.
 *
 * Simulates greedy play: always find the largest group, pop it, apply gravity, repeat.
 * Returns { isSolvable: boolean, estimatedMoves: number }.
 *
 * isValid = estimatedMoves <= moveLimit * 0.75
 *
 * Pure function. No Math.random. No Pixi. No DOM.
 */

import type { BoardState, BubbleCell } from '../state/types';
import { findConnectedGroup } from './groupFinder';
import { applyGravity } from './gravityFill';
import { removeGroup } from './boardLogic';

export interface SolvabilityResult {
  isSolvable: boolean;
  estimatedMoves: number;
}

/**
 * Check if a board is solvable by simulating greedy play.
 * Greedy: always pops the largest same-flavor group available.
 *
 * @param board - board state to check
 * @param moveLimit - level's move limit
 * @returns { isSolvable, estimatedMoves }
 */
export function isSolvable(board: BoardState, moveLimit: number): SolvabilityResult {
  let currentBoard = board;
  let moves = 0;
  const maxIterations = moveLimit * 2; // safety bound

  for (let i = 0; i < maxIterations; i++) {
    const bubbles = currentBoard.cells.filter((c): c is BubbleCell => c !== null);
    if (bubbles.length === 0) break;

    // Find all groups and select the largest
    const visited = new Set<string>();
    let largestGroup: BubbleCell[] = [];

    for (const bubble of bubbles) {
      const key = `${bubble.row},${bubble.col}`;
      if (visited.has(key)) continue;

      const group = findConnectedGroup(currentBoard, { row: bubble.row, col: bubble.col });
      for (const g of group) visited.add(`${g.row},${g.col}`);

      if (group.length > largestGroup.length) {
        largestGroup = group;
      }
    }

    // If largest group is size 1, the board is unsolvable (stuck)
    if (largestGroup.length < 2) break;

    // Pop the group and apply gravity
    const afterPop = removeGroup(currentBoard, largestGroup);
    const { after } = applyGravity(afterPop);
    currentBoard = after;
    moves++;

    // Check if snacks are exposed (simulated collection)
    // For solvability we just count moves to clear the board
  }

  const isValid = moves <= moveLimit * 0.75;
  return { isSolvable: isValid, estimatedMoves: moves };
}

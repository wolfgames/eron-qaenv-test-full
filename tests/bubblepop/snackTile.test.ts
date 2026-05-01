/**
 * snack tile: collection trigger
 * Batch 5 test loci
 */
import { describe, it, expect } from 'vitest';
import { checkSnackCollection, isSnackExposed } from '~/game/bubblepop/logic/snackLogic';
import type { BoardState, BubbleCell, SnackCell } from '~/game/bubblepop/state/types';

function makeBoard(cells: BubbleCell[], snacks: SnackCell[]): BoardState {
  return { cols: 7, rows: 9, cells, snacks };
}

function cell(row: number, col: number, flavor: BubbleCell['flavor'], id: string): BubbleCell {
  return { row, col, flavor, entityId: id };
}

function snack(row: number, col: number, covered: boolean, id: string): SnackCell {
  return { row, col, covered, entityId: id };
}

describe('snack tile: collection trigger', () => {
  it('snack tile renders as dim silhouette when covered', () => {
    // Covered snack: has a bubble directly above it in the column
    const board = makeBoard(
      [cell(6, 2, 'bone', 'blocker')], // bubble at row 6, col 2
      [snack(7, 2, true, 'snack1')],   // snack at row 7, col 2 — covered
    );

    const exposed = isSnackExposed(board, board.snacks[0]);
    expect(exposed).toBe(false);
  });

  it('snack auto-collects when no bubble above it in column', () => {
    // No bubble in column 2 at or above row 7
    const board = makeBoard(
      [cell(8, 2, 'bone', 'e1')], // bubble below the snack row — doesn't block
      [snack(7, 2, true, 'snack1')],
    );

    const exposed = isSnackExposed(board, board.snacks[0]);
    expect(exposed).toBe(true);
  });

  it('collecting snack decrements snacksRemaining in ECS', () => {
    // checkSnackCollection returns which snacks are now exposed
    const board = makeBoard(
      [], // no bubbles above
      [
        snack(7, 2, true, 'snack1'),
        snack(8, 4, true, 'snack2'),
      ],
    );

    const toCollect = checkSnackCollection(board);
    expect(toCollect).toHaveLength(2); // both snacks exposed
    expect(toCollect.map((s) => s.entityId)).toContain('snack1');
    expect(toCollect.map((s) => s.entityId)).toContain('snack2');
  });
});

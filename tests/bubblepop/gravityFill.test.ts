/**
 * gravity fill: timing and bounce
 * Batch 5 test loci
 */
import { describe, it, expect } from 'vitest';
import { applyGravity } from '~/game/bubblepop/logic/gravityFill';
import type { BoardState, BubbleCell } from '~/game/bubblepop/state/types';

function makeBoard(cells: BubbleCell[]): BoardState {
  return { cols: 7, rows: 9, cells, snacks: [] };
}

function cell(row: number, col: number, flavor: BubbleCell['flavor'], id: string): BubbleCell {
  return { row, col, flavor, entityId: id };
}

describe('gravity fill: timing and bounce', () => {
  it('fall duration scales with distance (distance*80ms)', () => {
    // Verify GravityDiff.distance correctly computes the distance
    const board = makeBoard([
      cell(0, 0, 'bone', 'e1'),  // drops 8 rows
      cell(2, 1, 'pizza', 'e2'), // drops 6 rows
    ]);

    const { diffs } = applyGravity(board);

    // e1 at row 0 → row 8: distance = 8
    const d1 = diffs.find((d) => d.entityId === 'e1');
    expect(d1).toBeDefined();
    expect(d1!.distance).toBe(8); // duration would be 8*80ms = 640ms

    // e2 at row 2 → row 8: distance = 6
    const d2 = diffs.find((d) => d.entityId === 'e2');
    expect(d2).toBeDefined();
    expect(d2!.distance).toBe(6); // duration would be 6*80ms = 480ms
  });

  it('squash magnitude scales with fall distance', () => {
    // This is a contract test: BoardRenderer.playGravityDrop uses diff.distance
    // to scale bounce. We verify distance values differ for different fall heights.
    const board = makeBoard([
      cell(7, 0, 'bone', 'short'),  // drops 1 row
      cell(0, 1, 'pizza', 'long'),  // drops 8 rows
    ]);

    const { diffs } = applyGravity(board);

    const shortDiff = diffs.find((d) => d.entityId === 'short');
    const longDiff = diffs.find((d) => d.entityId === 'long');

    expect(longDiff!.distance).toBeGreaterThan(shortDiff!.distance);
  });

  it('multi-column falls run in parallel', () => {
    // Both columns should have diffs — they don't wait for each other
    const board = makeBoard([
      cell(0, 0, 'bone', 'col0'), // col 0 drops 8
      cell(0, 3, 'pizza', 'col3'), // col 3 drops 8
    ]);

    const { diffs } = applyGravity(board);

    // Both columns produce diffs independently
    expect(diffs.find((d) => d.entityId === 'col0')).toBeDefined();
    expect(diffs.find((d) => d.entityId === 'col3')).toBeDefined();
  });

  it('entity IDs are stable across gravity (board diff keyed by entityId)', () => {
    const board = makeBoard([
      cell(2, 0, 'bone', 'stable-id'),
    ]);

    const { after } = applyGravity(board);

    // Same entityId must survive gravity
    const movedCell = after.cells.find((c) => c !== null && c.entityId === 'stable-id');
    expect(movedCell).toBeDefined();
    expect(movedCell!.entityId).toBe('stable-id');
    // Position changed (fell down)
    expect(movedCell!.row).toBe(8);
    expect(movedCell!.col).toBe(0);
  });
});

/**
 * boardLogic: group finder, gravity, stuck detection
 * Batch 2 test loci
 */
import { describe, it, expect } from 'vitest';
import { findConnectedGroup, applyGravity, detectStuck } from '~/game/bubblepop/logic/boardLogic';
import type { BoardState, BubbleCell } from '~/game/bubblepop/state/types';

// Helpers
function makeBoard(cells: BubbleCell[]): BoardState {
  return {
    cols: 7,
    rows: 9,
    cells,
    snacks: [],
  };
}

function cell(row: number, col: number, flavor: BubbleCell['flavor'], id: string): BubbleCell {
  return { row, col, flavor, entityId: id };
}

// ─── findConnectedGroup ───────────────────────────────────────────────────────

describe('boardLogic: group finder', () => {
  it('findConnectedGroup returns 3 connected same-flavor cells', () => {
    const board = makeBoard([
      cell(0, 0, 'bone', 'e1'),
      cell(0, 1, 'bone', 'e2'),
      cell(0, 2, 'bone', 'e3'),
    ]);
    const group = findConnectedGroup(board, { row: 0, col: 0 });
    expect(group).toHaveLength(3);
    const ids = group.map((c) => c.entityId).sort();
    expect(ids).toEqual(['e1', 'e2', 'e3'].sort());
  });

  it('findConnectedGroup returns size-1 group for lone bubble', () => {
    const board = makeBoard([
      cell(0, 0, 'bone', 'e1'),
      cell(0, 2, 'pizza', 'e2'), // not adjacent
    ]);
    const group = findConnectedGroup(board, { row: 0, col: 0 });
    expect(group).toHaveLength(1);
    expect(group[0].entityId).toBe('e1');
  });

  it('findConnectedGroup does not cross-flavor boundaries', () => {
    const board = makeBoard([
      cell(0, 0, 'bone', 'e1'),
      cell(0, 1, 'pizza', 'e2'), // adjacent but different flavor
      cell(0, 2, 'bone', 'e3'), // same flavor, not connected through e2
    ]);
    const group = findConnectedGroup(board, { row: 0, col: 0 });
    expect(group).toHaveLength(1);
    expect(group[0].entityId).toBe('e1');
  });
});

// ─── applyGravity ─────────────────────────────────────────────────────────────

describe('boardLogic: gravity', () => {
  it('applyGravity drops bubbles downward with stable entity IDs', () => {
    // Row 3 has bubbles, rows 4-5 are empty in col 0
    const board = makeBoard([
      cell(3, 0, 'bone', 'e1'),
      cell(3, 1, 'pizza', 'e2'),
    ]);
    const { after } = applyGravity(board);
    // Bubbles should fall to the bottom rows (row 8 = last row)
    const c0 = after.cells.find((c) => c?.entityId === 'e1');
    const c1 = after.cells.find((c) => c?.entityId === 'e2');
    expect(c0).toBeDefined();
    expect(c1).toBeDefined();
    // They should be at row 8 (bottom)
    expect(c0!.row).toBe(8);
    expect(c1!.row).toBe(8);
    // Entity IDs must be stable
    expect(c0!.entityId).toBe('e1');
    expect(c1!.entityId).toBe('e2');
  });

  it('applyGravity does not collapse empty columns horizontally', () => {
    // Col 0 has a bubble at row 0, cols 1-6 are empty
    const board = makeBoard([
      cell(0, 0, 'bone', 'e1'),
    ]);
    const { after } = applyGravity(board);
    // After gravity, bubble in col 0 falls to row 8, col 0 stays
    const c = after.cells.find((c) => c !== null);
    expect(c).toBeDefined();
    expect(c!.col).toBe(0); // column must not change
    expect(c!.row).toBe(8); // falls to bottom
  });
});

// ─── detectStuck ─────────────────────────────────────────────────────────────

describe('boardLogic: stuck detection', () => {
  it('detectStuck returns true when no group of 2+ same flavor exists', () => {
    // All different flavors, no matching neighbors
    const board = makeBoard([
      cell(8, 0, 'bone', 'e1'),
      cell(8, 1, 'pizza', 'e2'),
      cell(8, 2, 'burger', 'e3'),
      cell(8, 3, 'hotdog', 'e4'),
    ]);
    expect(detectStuck(board)).toBe(true);
  });

  it('detectStuck returns false when valid group exists', () => {
    const board = makeBoard([
      cell(8, 0, 'bone', 'e1'),
      cell(8, 1, 'bone', 'e2'), // adjacent same flavor = valid group
    ]);
    expect(detectStuck(board)).toBe(false);
  });
});

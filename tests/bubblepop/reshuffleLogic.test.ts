/**
 * reshuffle: stuck detection and reshuffle correctness
 * Batch 7 test loci
 */
import { describe, it, expect } from 'vitest';
import { detectStuck } from '~/game/bubblepop/logic/boardLogic';
import { reshuffleTopHalf, createSeededRng } from '~/game/bubblepop/logic/reshuffleLogic';
import type { BoardState, BubbleCell } from '~/game/bubblepop/state/types';

function makeBoard(cells: BubbleCell[]): BoardState {
  return { cols: 7, rows: 9, cells, snacks: [] };
}

function cell(row: number, col: number, flavor: BubbleCell['flavor'], id: string): BubbleCell {
  return { row, col, flavor, entityId: id };
}

describe('reshuffle: stuck detection and reshuffle correctness', () => {
  it('detectStuck returns true when all bubbles are loners', () => {
    // 7 different flavors in different columns — no adjacent same-flavor pairs
    const board = makeBoard([
      cell(8, 0, 'bone', 'e0'),
      cell(8, 1, 'pizza', 'e1'),
      cell(8, 2, 'burger', 'e2'),
      cell(8, 3, 'hotdog', 'e3'),
      cell(8, 4, 'sandwich', 'e4'),
      cell(8, 5, 'bone', 'e5'),     // same as e0 but not adjacent
      cell(8, 6, 'pizza', 'e6'),    // same as e1 but not adjacent
    ]);

    // Wait — e0 (col0 bone) and e5 (col5 bone) are not adjacent (col5 != col0+1)
    // e0 (col0) neighbors: col1=pizza — no bone. So bone is isolated.
    expect(detectStuck(board)).toBe(true);
  });

  it('reshuffleTopHalf produces a board with at least one valid group', () => {
    // All loner board
    const board = makeBoard([
      cell(0, 0, 'bone', 'e0'),
      cell(0, 1, 'pizza', 'e1'),
      cell(0, 2, 'burger', 'e2'),
      cell(0, 3, 'hotdog', 'e3'),
      cell(1, 0, 'sandwich', 'e4'),
      cell(1, 1, 'bone', 'e5'),
      cell(1, 2, 'pizza', 'e6'),
      cell(1, 3, 'burger', 'e7'),
      cell(2, 0, 'hotdog', 'e8'),
      cell(2, 1, 'sandwich', 'e9'),
      // Rows 3-8 empty (only top half needs reshuffle)
    ]);

    const rng = createSeededRng(42);
    const reshuffled = reshuffleTopHalf(board, rng);

    expect(detectStuck(reshuffled)).toBe(false);
  });

  it('reshuffleTopHalf is deterministic for same RNG state', () => {
    const board = makeBoard([
      cell(0, 0, 'bone', 'e0'),
      cell(0, 1, 'pizza', 'e1'),
      cell(0, 2, 'burger', 'e2'),
      cell(1, 0, 'hotdog', 'e3'),
      cell(1, 1, 'sandwich', 'e4'),
      cell(1, 2, 'bone', 'e5'),
    ]);

    const result1 = reshuffleTopHalf(board, createSeededRng(99));
    const result2 = reshuffleTopHalf(board, createSeededRng(99));

    expect(JSON.stringify(result1.cells)).toBe(JSON.stringify(result2.cells));
  });
});

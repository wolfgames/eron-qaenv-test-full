/**
 * hand-crafted levels: schema validation
 * Batch 2 test loci
 */
import { describe, it, expect } from 'vitest';
import levels from '~/game/bubblepop/data/hand-crafted-levels.json';
import type { Flavor } from '~/game/bubblepop/state/types';

const VALID_FLAVORS: Flavor[] = ['bone', 'pizza', 'burger', 'hotdog', 'sandwich'];

describe('hand-crafted levels: schema validation', () => {
  it('level 1 has 7 cols, 9 rows, 3 flavors, 35 moves, 3 snacks, 0 ghosts', () => {
    const level1 = levels.find((l) => l.id === 1);
    expect(level1).toBeDefined();
    expect(level1!.cols).toBe(7);
    expect(level1!.rows).toBe(9);
    expect(level1!.moveLimit).toBe(35);
    expect(level1!.snackCount).toBe(3);
    expect(level1!.ghostCount).toBe(0);

    // Count distinct flavors
    const flavors = new Set(level1!.board.filter((c) => c.flavor).map((c) => c.flavor));
    expect(flavors.size).toBe(3);

    // Validate all flavors are valid
    for (const f of flavors) {
      expect(VALID_FLAVORS).toContain(f);
    }
  });

  it('all 5 levels have chapterIndex 0 and valid schema', () => {
    expect(levels).toHaveLength(5);

    for (const level of levels) {
      expect(typeof level.id).toBe('number');
      expect(level.chapterIndex).toBe(0);
      expect(level.cols).toBe(7);
      expect(level.rows).toBe(9);
      expect(typeof level.moveLimit).toBe('number');
      expect(level.moveLimit).toBeGreaterThan(0);
      expect(typeof level.snackCount).toBe('number');
      expect(level.snackCount).toBeGreaterThan(0);
      expect(typeof level.ghostCount).toBe('number');
      expect(level.ghostCount).toBe(0); // no ghosts in levels 1-5

      // Board cells must have valid fields
      for (const cell of level.board) {
        expect(typeof cell.row).toBe('number');
        expect(typeof cell.col).toBe('number');
        expect(cell.row).toBeGreaterThanOrEqual(0);
        expect(cell.row).toBeLessThan(level.rows);
        expect(cell.col).toBeGreaterThanOrEqual(0);
        expect(cell.col).toBeLessThan(level.cols);
        if (cell.flavor) {
          expect(VALID_FLAVORS).toContain(cell.flavor);
        }
        expect(typeof cell.entityId).toBe('string');
        expect(cell.entityId.length).toBeGreaterThan(0);
      }

      // Must have enough levels for sessionDrawCount:1
      expect(levels.length).toBeGreaterThanOrEqual(1);
    }
  });
});

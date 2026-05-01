/**
 * Edge-case tests — stabilize phase (60-stabilize)
 *
 * One additional edge-case per new feature identified in implementation-plan.yml.
 * These cover paths not exercised by the batch-level test loci.
 */
import { describe, it, expect, vi } from 'vitest';
import { findConnectedGroup } from '~/game/bubblepop/logic/groupFinder';
import { applyGravity } from '~/game/bubblepop/logic/gravityFill';
import {
  computePopScore,
  computeCascadeMultiplier,
  computeMoveEfficiency,
  computeLevelScore,
} from '~/game/bubblepop/logic/scoringLogic';
import { detectStuck } from '~/game/bubblepop/logic/boardLogic';
import { WinLoseDetector } from '~/game/bubblepop/logic/winLoseDetector';
import { TapHandler } from '~/game/bubblepop/logic/tapHandler';
import type { BoardState, BubbleCell } from '~/game/bubblepop/state/types';

function makeBoard(cells: BubbleCell[]): BoardState {
  return { cols: 7, rows: 9, cells, snacks: [] };
}

function cell(row: number, col: number, flavor: BubbleCell['flavor'], id: string): BubbleCell {
  return { row, col, flavor, entityId: id };
}

// ─── groupFinder: diagonal isolation ─────────────────────────────────────────
describe('edge-case: groupFinder — diagonal isolation', () => {
  it('same-flavor bubbles placed diagonally are NOT connected (4-directional only)', () => {
    // e1 at (0,0) and e2 at (1,1) are diagonal — not orthogonally adjacent
    const board = makeBoard([
      cell(0, 0, 'bone', 'e1'),
      cell(1, 1, 'bone', 'e2'),
    ]);
    const group = findConnectedGroup(board, { row: 0, col: 0 });
    // Only e1 should be in the group — diagonal neighbor not included
    expect(group).toHaveLength(1);
    expect(group[0].entityId).toBe('e1');
  });
});

// ─── gravityFill: no-movement cells produce no diff ───────────────────────────
describe('edge-case: gravityFill — settled cell generates no diff', () => {
  it('a bubble already at the bottom of its column does not appear in diffs', () => {
    // e1 at row 8 (already at bottom in col 0, rows=9) — no room to fall
    const board = makeBoard([
      cell(8, 0, 'pizza', 'e1'),
    ]);
    const { diffs } = applyGravity(board);
    // e1 was already at the bottom — should not produce a diff
    const d = diffs.find((diff) => diff.entityId === 'e1');
    expect(d).toBeUndefined();
  });
});

// ─── scoringLogic: boundary / overflow edge cases ─────────────────────────────
describe('edge-case: scoringLogic — size-1 pop and zero-move guard', () => {
  it('computePopScore returns 0 for a lone single (groupSize=1)', () => {
    // A lone bubble that slipped through (invalid tap path)
    expect(computePopScore(1)).toBe(0);
  });

  it('computeMoveEfficiency guards against zero movesUsed (no division by zero)', () => {
    // If somehow movesUsed=0 (e.g. first-move win), should not throw
    const result = computeMoveEfficiency(35, 0);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeGreaterThan(0);
  });

  it('levelScore with depth-3 cascade is >= 4x depth-0 score (escalation guarantee)', () => {
    const baseScore = computePopScore(3);
    const flat = computeLevelScore(baseScore, computeCascadeMultiplier(0), 1.0);
    const deep = computeLevelScore(baseScore, computeCascadeMultiplier(3), 1.0);
    // cascade x4 means deep should be exactly 4× flat
    expect(deep).toBe(flat * 4);
  });
});

// ─── detectStuck: all-same flavor board is NOT stuck ─────────────────────────
describe('edge-case: detectStuck — all same flavor is not stuck', () => {
  it('a board where every bubble is the same flavor has at least one valid group', () => {
    // Full row of same flavor — trivially not stuck
    const board = makeBoard([
      cell(8, 0, 'bone', 'e1'),
      cell(8, 1, 'bone', 'e2'),
      cell(8, 2, 'bone', 'e3'),
      cell(8, 3, 'bone', 'e4'),
    ]);
    expect(detectStuck(board)).toBe(false);
  });
});

// ─── winLoseDetector: exact boundary (50% remaining = 2 stars) ───────────────
describe('edge-case: WinLoseDetector — star boundary at exactly 50%', () => {
  it('movesRemaining/moveLimit == 0.5 exactly → 2 stars (boundary is exclusive for 3)', () => {
    const onWin = vi.fn();
    const detector = new WinLoseDetector({ onWin, onLose: vi.fn(), moveLimit: 20 });
    // 10/20 = 0.5 — the criterion is > 0.5 for 3 stars, so exactly 0.5 = 2 stars
    detector.check({ snacksRemaining: 0, movesRemaining: 10 });
    expect(onWin).toHaveBeenCalledWith(expect.objectContaining({ stars: 2 }));
  });
});

// ─── TapHandler: multiple queued taps drain one at a time ─────────────────────
describe('edge-case: TapHandler — queue drains one tap at a time', () => {
  it('when 3 taps arrive during Animating, drainQueue processes only the first', () => {
    const onValidTap = vi.fn();
    let phase = 'animating' as 'idle' | 'animating';

    const handler = new TapHandler({
      getBoard: () => makeBoard([
        cell(0, 0, 'bone', 'e1'),
        cell(0, 1, 'bone', 'e2'),
      ]),
      getPhase: () => phase,
      onValidTap,
      onInvalidTap: vi.fn(),
    });

    // Queue 3 taps while animating
    handler.handleTap({ row: 0, col: 0 });
    handler.handleTap({ row: 0, col: 0 });
    handler.handleTap({ row: 0, col: 0 });
    expect(onValidTap).not.toHaveBeenCalled();

    // Drain once — only the first queued tap should fire
    phase = 'idle';
    handler.drainQueue();
    expect(onValidTap).toHaveBeenCalledTimes(1);
  });
});

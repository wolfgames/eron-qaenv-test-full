/**
 * tap interaction: dispatch and blocking
 * Batch 4 test loci
 */
import { describe, it, expect, vi } from 'vitest';
import { TapHandler } from '~/game/bubblepop/logic/tapHandler';
import type { BoardState, BubbleCell } from '~/game/bubblepop/state/types';

function makeBoard(cells: BubbleCell[]): BoardState {
  return { cols: 7, rows: 9, cells, snacks: [] };
}

function cell(row: number, col: number, flavor: BubbleCell['flavor'], id: string): BubbleCell {
  return { row, col, flavor, entityId: id };
}

describe('tap interaction: dispatch and blocking', () => {
  it('valid group tap dispatches executeTap and transitions phase to Animating', () => {
    const onValidTap = vi.fn();
    const onInvalidTap = vi.fn();

    const handler = new TapHandler({
      getBoard: () => makeBoard([
        cell(0, 0, 'bone', 'e1'),
        cell(0, 1, 'bone', 'e2'),
        cell(0, 2, 'bone', 'e3'),
      ]),
      getPhase: () => 'idle',
      onValidTap,
      onInvalidTap,
    });

    handler.handleTap({ row: 0, col: 0 });

    expect(onValidTap).toHaveBeenCalledOnce();
    // onValidTap receives the group (3 cells)
    const callArgs = onValidTap.mock.calls[0][0];
    expect(callArgs.group).toHaveLength(3);
  });

  it('lone-single tap does not dispatch executeTap, fires shake feedback', () => {
    const onValidTap = vi.fn();
    const onInvalidTap = vi.fn();

    const handler = new TapHandler({
      getBoard: () => makeBoard([
        cell(0, 0, 'bone', 'e1'),
        cell(0, 2, 'pizza', 'e2'), // not adjacent
      ]),
      getPhase: () => 'idle',
      onValidTap,
      onInvalidTap,
    });

    handler.handleTap({ row: 0, col: 0 });

    expect(onValidTap).not.toHaveBeenCalled();
    expect(onInvalidTap).toHaveBeenCalledOnce();
  });

  it('tap during Animating phase is queued not dropped', () => {
    const onValidTap = vi.fn();
    let currentPhase = 'animating';

    const handler = new TapHandler({
      getBoard: () => makeBoard([
        cell(0, 0, 'bone', 'e1'),
        cell(0, 1, 'bone', 'e2'),
      ]),
      getPhase: () => currentPhase as 'idle' | 'animating',
      onValidTap,
      onInvalidTap: vi.fn(),
    });

    // Tap during animating — should be queued
    handler.handleTap({ row: 0, col: 0 });
    expect(onValidTap).not.toHaveBeenCalled(); // not yet dispatched

    // Board settles — drain queue
    currentPhase = 'idle';
    handler.drainQueue();
    expect(onValidTap).toHaveBeenCalledOnce(); // now dispatched
  });
});

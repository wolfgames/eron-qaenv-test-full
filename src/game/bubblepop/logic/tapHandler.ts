/**
 * TapHandler — routes pointer taps to game logic.
 *
 * Responsibilities:
 *   1. Resolves tap position to a board cell.
 *   2. Finds the connected group via findConnectedGroup().
 *   3. Dispatches onValidTap or onInvalidTap.
 *   4. Queues taps during non-idle phases (animating, won, lost, reshuffling).
 *   5. Drains queue on phase return to idle.
 *
 * Pure state management — no Pixi, no GSAP, no DOM.
 */

import type { BoardState, BoardPhase, CellPosition, BubbleCell } from '../state/types';
import { findConnectedGroup } from './groupFinder';

export interface TapHandlerOptions {
  getBoard: () => BoardState;
  getPhase: () => BoardPhase | 'idle' | 'animating';
  onValidTap: (result: { pos: CellPosition; group: BubbleCell[] }) => void;
  onInvalidTap: (pos: CellPosition) => void;
}

export class TapHandler {
  private _opts: TapHandlerOptions;
  private _queue: CellPosition[] = [];

  constructor(opts: TapHandlerOptions) {
    this._opts = opts;
  }

  /**
   * Handle a tap at a board cell position.
   * If phase is not idle, queues the tap for later.
   */
  handleTap(pos: CellPosition): void {
    const phase = this._opts.getPhase();

    if (phase !== 'idle') {
      // Queue tap for after animation drains
      this._queue.push(pos);
      return;
    }

    this._processTap(pos);
  }

  /**
   * Drain the tap queue. Called by GameController when boardPhase returns to 'idle'.
   */
  drainQueue(): void {
    const pending = this._queue.splice(0, 1);
    if (pending.length > 0) {
      this._processTap(pending[0]);
    }
  }

  private _processTap(pos: CellPosition): void {
    const board = this._opts.getBoard();
    const group = findConnectedGroup(board, pos);

    if (group.length >= 2) {
      this._opts.onValidTap({ pos, group });
    } else {
      this._opts.onInvalidTap(pos);
    }
  }
}

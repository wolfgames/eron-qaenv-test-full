/**
 * WinLoseDetector — pure logic for detecting win/lose conditions.
 *
 * Win: snacksRemaining === 0
 * Lose: movesRemaining === 0 AND snacksRemaining > 0
 *
 * Stars: 3 if movesRemaining/moveLimit > 0.5; 2 if 0.2–0.5; 1 if < 0.2
 */

import { computeStars } from './scoringLogic';

export interface WinLoseResult {
  win: boolean;
  stars?: 1 | 2 | 3;
}

export interface WinLoseDetectorOptions {
  onWin: (result: WinLoseResult) => void;
  onLose: (result: WinLoseResult) => void;
  moveLimit?: number;
}

export class WinLoseDetector {
  private _opts: WinLoseDetectorOptions;
  private _triggered: boolean = false;

  constructor(opts: WinLoseDetectorOptions) {
    this._opts = opts;
  }

  /**
   * Check current state and fire onWin / onLose if conditions are met.
   * Idempotent after first trigger.
   */
  check({ snacksRemaining, movesRemaining }: { snacksRemaining: number; movesRemaining: number }): void {
    if (this._triggered) return;

    if (snacksRemaining === 0) {
      this._triggered = true;
      const moveLimit = this._opts.moveLimit ?? 35;
      const stars = computeStars(movesRemaining, moveLimit);
      this._opts.onWin({ win: true, stars });
      return;
    }

    if (movesRemaining === 0 && snacksRemaining > 0) {
      this._triggered = true;
      this._opts.onLose({ win: false });
      return;
    }
  }

  /**
   * Reset the detector for a new game / level.
   */
  reset(): void {
    this._triggered = false;
  }
}

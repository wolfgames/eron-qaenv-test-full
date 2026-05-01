/**
 * win/lose: condition triggers
 * Batch 6 test loci
 */
import { describe, it, expect, vi } from 'vitest';
import { WinLoseDetector } from '~/game/bubblepop/logic/winLoseDetector';

describe('win/lose: condition triggers', () => {
  it('snacksRemaining==0 triggers win and goto("results") with win:true', () => {
    const onWin = vi.fn();
    const onLose = vi.fn();

    const detector = new WinLoseDetector({ onWin, onLose });
    detector.check({ snacksRemaining: 0, movesRemaining: 10 });

    expect(onWin).toHaveBeenCalledOnce();
    expect(onWin).toHaveBeenCalledWith(expect.objectContaining({ win: true }));
    expect(onLose).not.toHaveBeenCalled();
  });

  it('movesRemaining==0 with snacks>0 triggers loss and goto("results") with win:false', () => {
    const onWin = vi.fn();
    const onLose = vi.fn();

    const detector = new WinLoseDetector({ onWin, onLose });
    detector.check({ snacksRemaining: 2, movesRemaining: 0 });

    expect(onLose).toHaveBeenCalledOnce();
    expect(onLose).toHaveBeenCalledWith(expect.objectContaining({ win: false }));
    expect(onWin).not.toHaveBeenCalled();
  });

  it('starsEarned:3 when movesRemaining/moveLimit > 0.5', () => {
    const onWin = vi.fn();
    const detector = new WinLoseDetector({ onWin, onLose: vi.fn(), moveLimit: 35 });

    // 20/35 = 57% remaining — should be 3 stars
    detector.check({ snacksRemaining: 0, movesRemaining: 20 });

    expect(onWin).toHaveBeenCalledWith(expect.objectContaining({ stars: 3 }));
  });

  it('starsEarned:1 when movesRemaining/moveLimit < 0.2', () => {
    const onWin = vi.fn();
    const detector = new WinLoseDetector({ onWin, onLose: vi.fn(), moveLimit: 35 });

    // 5/35 = 14% remaining — should be 1 star
    detector.check({ snacksRemaining: 0, movesRemaining: 5 });

    expect(onWin).toHaveBeenCalledWith(expect.objectContaining({ stars: 1 }));
  });
});

/**
 * intro cutscene: session gate and skip
 * Batch 8 test loci
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { IntroOverlayController, INTRO_FLAG_KEY } from '~/game/bubblepop/screens/IntroOverlay';

// Simple localStorage mock for Node environment
const localStorageMock: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => localStorageMock[key] ?? null,
  setItem: (key: string, value: string) => { localStorageMock[key] = value; },
  removeItem: (key: string) => { delete localStorageMock[key]; },
  clear: () => { Object.keys(localStorageMock).forEach(k => delete localStorageMock[k]); },
  length: 0,
  key: () => null,
};

describe('intro cutscene: session gate and skip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows on first session (flag=false)', () => {
    const controller = new IntroOverlayController({ onComplete: () => {} });
    expect(controller.shouldShow()).toBe(true);
  });

  it('skip dismisses immediately and sets flag', () => {
    let completed = false;
    const controller = new IntroOverlayController({
      onComplete: () => { completed = true; },
    });

    controller.skip();

    // Flag should be set in localStorage
    expect(localStorage.getItem(INTRO_FLAG_KEY)).toBe('true');
    // Completion callback should have been called
    expect(completed).toBe(true);
  });

  it('does not show on second session (flag=true)', () => {
    // Set the flag as if first session already completed
    localStorage.setItem(INTRO_FLAG_KEY, 'true');

    const controller = new IntroOverlayController({ onComplete: () => {} });
    expect(controller.shouldShow()).toBe(false);
  });
});

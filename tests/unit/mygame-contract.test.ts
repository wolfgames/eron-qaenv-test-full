/**
 * mygame contract validation.
 *
 * Ensures the mygame module exports functions that satisfy
 * the contract types required by the scaffold screens.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@wolfgames/components/solid', () => ({
  Spinner: () => null,
  ProgressBar: () => null,
  useSignal: (s: { get: () => unknown }) => s.get,
}));

vi.mock('solid-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('solid-js')>();
  return { ...actual };
});

// Mock pixi.js to avoid navigator/GPU requirements in Node
vi.mock('pixi.js', () => {
  class MockContainer {
    children: unknown[] = [];
    addChild = vi.fn();
    removeChild = vi.fn();
    destroy = vi.fn();
    on = vi.fn();
    removeAllListeners = vi.fn();
    eventMode = 'passive';
    x = 0;
    y = 0;
  }
  return {
    Application: class { stage = new MockContainer(); screen = {}; canvas = {}; async init() {} destroy() {} ticker = { addOnce: vi.fn() }; },
    Container: MockContainer,
    Graphics: class { rect = vi.fn().mockReturnThis(); circle = vi.fn().mockReturnThis(); fill = vi.fn().mockReturnThis(); clear = vi.fn().mockReturnThis(); },
    Text: class { text = ''; anchor = { set: vi.fn() }; x = 0; y = 0; destroy = vi.fn(); },
  };
});

// Mock @adobe/data/ecs to avoid blob-store Node errors
vi.mock('@adobe/data/ecs', () => ({
  Database: {
    create: vi.fn(() => ({
      resources: { score: 0, movesRemaining: 35, snacksRemaining: 3, starsEarned: 0, boardPhase: 'idle' },
      transactions: { addScore: vi.fn(), decrementMoves: vi.fn(), replaceBoard: vi.fn(), collectSnack: vi.fn(), setState: vi.fn(), setStars: vi.fn(), resetGame: vi.fn() },
      observe: {
        resources: {
          score: vi.fn(() => vi.fn()),
          movesRemaining: vi.fn(() => vi.fn()),
          snacksRemaining: vi.fn(() => vi.fn()),
          starsEarned: vi.fn(() => vi.fn()),
        },
      },
      select: vi.fn(() => []),
      read: vi.fn(() => null),
    })),
    Plugin: { create: vi.fn((p: unknown) => p) },
  },
}));

// Mock ECS core
vi.mock('~/core/systems/ecs', () => ({
  setActiveDb: vi.fn(),
  activeDb: vi.fn(() => null),
}));

// Mock useScreen
vi.mock('~/core/systems/screens', () => ({
  useScreen: () => ({ goto: vi.fn(), current: null }),
}));

// Mock gsap
vi.mock('gsap', () => ({
  gsap: { killTweensOf: vi.fn(), to: vi.fn(), delayedCall: vi.fn() },
  default: { killTweensOf: vi.fn(), to: vi.fn(), delayedCall: vi.fn() },
}));

// Mock game state
vi.mock('~/game/state', () => ({
  gameState: {
    score: vi.fn(() => 0), setScore: vi.fn(), addScore: vi.fn(),
    level: vi.fn(() => 1), setLevel: vi.fn(), incrementLevel: vi.fn(),
    win: vi.fn(() => false), setWin: vi.fn(),
    stars: vi.fn(() => 1), setStars: vi.fn(),
    movesRemaining: vi.fn(() => 35), setMovesRemaining: vi.fn(),
    snacksRemaining: vi.fn(() => 3), setSnacksRemaining: vi.fn(),
    chapterName: vi.fn(() => ''), setChapterName: vi.fn(),
    reset: vi.fn(),
  },
}));

// Mock bridgeEcsToSignals
vi.mock('~/game/bubblepop/state/bridgeEcsToSignals', () => ({
  bridgeEcsToSignals: vi.fn(() => vi.fn()),
}));

import { setupGame, setupStartScreen } from '~/game/mygame';
import type { SetupGame, SetupStartScreen } from '~/game/mygame-contract';

describe('mygame contract', () => {
  it('exports setupGame matching SetupGame signature', () => {
    expect(typeof setupGame).toBe('function');

    const _typeCheck: SetupGame = setupGame;
    expect(_typeCheck).toBe(setupGame);
  });

  it('exports setupStartScreen matching SetupStartScreen signature', () => {
    expect(typeof setupStartScreen).toBe('function');

    const _typeCheck: SetupStartScreen = setupStartScreen;
    expect(_typeCheck).toBe(setupStartScreen);
  });
});

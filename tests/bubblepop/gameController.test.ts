/**
 * GameController — Pixi init
 * Batch 1 test loci
 *
 * These tests validate the contract shape and config of BubblePopGameController
 * in a Node environment. GPU init is mocked; the full rendering path is tested
 * in integration via bun run build.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock pixi.js to avoid GPU requirements in Node environment
vi.mock('pixi.js', () => {
  class MockContainer {
    children: unknown[] = [];
    addChild = vi.fn();
    removeChild = vi.fn();
    destroy = vi.fn();
    on = vi.fn();
    off = vi.fn();
    removeAllListeners = vi.fn();
    eventMode = 'passive';
    hitArea = null;
    position = { set: vi.fn() };
    scale = { set: vi.fn(), x: 1, y: 1 };
    x = 0;
    y = 0;
    rotation = 0;
    alpha = 1;
  }

  return {
    Application: class MockApplication {
      stage = new MockContainer();
      screen = { width: 390, height: 844 };
      canvas = {};
      async init(_opts: unknown) { return Promise.resolve(); }
      destroy(_removeView: unknown, _opts: unknown) {}
      ticker = { addOnce: (fn: () => void) => { fn(); } };
    },
    Container: MockContainer,
    Graphics: class MockGraphics {
      clear = vi.fn().mockReturnThis();
      fill = vi.fn().mockReturnThis();
      circle = vi.fn().mockReturnThis();
      rect = vi.fn().mockReturnThis();
      roundRect = vi.fn().mockReturnThis();
      stroke = vi.fn().mockReturnThis();
      hitArea = null;
    },
    Text: class MockText {
      text = '';
      style = {};
      anchor = { set: vi.fn() };
      position = { set: vi.fn() };
      x = 0;
      y = 0;
      destroy = vi.fn();
    },
  };
});

// Mock gsap
vi.mock('gsap', () => ({
  gsap: { killTweensOf: vi.fn(), to: vi.fn() },
  default: { killTweensOf: vi.fn(), to: vi.fn() },
}));

// Mock solid-js createSignal for Node
vi.mock('solid-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('solid-js')>();
  return { ...actual };
});

// Mock @adobe/data/ecs to avoid Node blob-store errors
const mockDb = {
  resources: { score: 0, movesRemaining: 35, snacksRemaining: 3, starsEarned: 0, boardPhase: 'idle' },
  transactions: { addScore: vi.fn(), decrementMoves: vi.fn(), replaceBoard: vi.fn(), collectSnack: vi.fn(), setState: vi.fn(), setStars: vi.fn(), resetGame: vi.fn() },
  actions: { executeTap: vi.fn() },
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
};

vi.mock('@adobe/data/ecs', () => ({
  Database: {
    create: vi.fn(() => mockDb),
    Plugin: {
      create: vi.fn((plugin: unknown) => plugin),
    },
  },
}));

// Mock ECS bridge module
vi.mock('~/core/systems/ecs', () => ({
  setActiveDb: vi.fn(),
  activeDb: vi.fn(() => null),
}));

// Mock BubblePopPlugin to use a plain object (avoids Database.create at plugin level)
vi.mock('~/game/bubblepop/state/BubblePopPlugin', () => ({
  bubblePopPlugin: {},
}));

// Mock gameState
vi.mock('~/game/state', () => ({
  gameState: {
    score: vi.fn(() => 0),
    setScore: vi.fn(),
    addScore: vi.fn(),
    level: vi.fn(() => 1),
    setLevel: vi.fn(),
    incrementLevel: vi.fn(),
    win: vi.fn(() => false),
    setWin: vi.fn(),
    stars: vi.fn(() => 1),
    setStars: vi.fn(),
    movesRemaining: vi.fn(() => 35),
    setMovesRemaining: vi.fn(),
    snacksRemaining: vi.fn(() => 3),
    setSnacksRemaining: vi.fn(),
    chapterName: vi.fn(() => ''),
    setChapterName: vi.fn(),
    reset: vi.fn(),
  },
}));

// Mock bridgeEcsToSignals
vi.mock('~/game/bubblepop/state/bridgeEcsToSignals', () => ({
  bridgeEcsToSignals: vi.fn(() => vi.fn()),
}));

import { BubblePopGameController } from '~/game/bubblepop/GameController';

describe('GameController — Pixi init', () => {
  let mockContainer: { appendChild: ReturnType<typeof vi.fn>; clientWidth: number; clientHeight: number };

  beforeEach(() => {
    mockContainer = {
      appendChild: vi.fn(),
      clientWidth: 390,
      clientHeight: 844,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('gameMode is pixi after init', () => {
    const gc = BubblePopGameController.create({
      coordinator: {} as unknown,
      tuning: { scaffold: {} as unknown, game: {} as unknown },
      audio: {},
      gameData: {},
      analytics: {},
    } as Parameters<typeof BubblePopGameController.create>[0]);

    expect(gc.gameMode).toBe('pixi');
  });

  it('stage has 4 layers: bg, board, hud, ui', async () => {
    const gc = BubblePopGameController.create({
      coordinator: {} as unknown,
      tuning: { scaffold: {} as unknown, game: {} as unknown },
      audio: {},
      gameData: {},
      analytics: {},
    } as Parameters<typeof BubblePopGameController.create>[0]);

    await gc.init(mockContainer as unknown as HTMLDivElement);

    // Verify 4 layers exist on the controller
    expect(gc.layers).toBeDefined();
    expect(gc.layers.bg).toBeDefined();
    expect(gc.layers.board).toBeDefined();
    expect(gc.layers.hud).toBeDefined();
    expect(gc.layers.ui).toBeDefined();
  });
});

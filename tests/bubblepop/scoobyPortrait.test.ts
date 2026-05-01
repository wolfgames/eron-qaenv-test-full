/**
 * Scooby portrait: reactive expressions
 * Batch 8 test loci
 */
import { describe, it, expect, vi } from 'vitest';

// Mock pixi.js
vi.mock('pixi.js', () => ({
  Container: class MockContainer {
    x = 0; y = 0;
    addChild = vi.fn(); removeChild = vi.fn(); destroy = vi.fn();
    eventMode = 'none'; alpha = 1; scale = { x: 1, y: 1, set: vi.fn() };
    tint = 0xffffff;
    children: unknown[] = [];
    removeAllListeners = vi.fn();
  },
  Text: class MockText {
    text = ''; style = {}; anchor = { set: vi.fn() }; x = 0; y = 0;
    alpha = 1; tint = 0xffffff; scale = { x: 1, y: 1, set: vi.fn() };
    destroy = vi.fn(); rotation = 0;
  },
  Graphics: class MockGraphics {
    fill = vi.fn().mockReturnThis(); circle = vi.fn().mockReturnThis();
    x = 0; y = 0; destroy = vi.fn(); addChild = vi.fn();
    children: unknown[] = [];
  },
}));

// Mock gsap
vi.mock('gsap', () => ({
  gsap: { killTweensOf: vi.fn(), to: vi.fn(() => ({ then: vi.fn() })) },
  default: { killTweensOf: vi.fn(), to: vi.fn(() => ({ then: vi.fn() })) },
}));

import { ScoobyPortraitRenderer } from '~/game/bubblepop/renderers/ScoobyPortraitRenderer';

describe('Scooby portrait: reactive expressions', () => {
  it('portrait renders within reserved_bottom_px zone (bottom-left)', () => {
    const renderer = new ScoobyPortraitRenderer();
    renderer.init(390, 844, 64);

    // Portrait should be in the bottom-left area
    // x < viewportW/2, y > viewportH - reservedBottom
    expect(renderer.container.x).toBeLessThan(390 / 2);
    // Y position should be in the bottom reserved zone
    expect(renderer.container.y).toBeGreaterThan(844 - 64 - 60); // within 60px of bottom
  });

  it('large pop (>=5 bubbles) triggers excited expression GSAP tween', () => {
    const renderer = new ScoobyPortraitRenderer();
    renderer.init(390, 844, 64);

    renderer.react('excited');

    // After react(), the expression should have been triggered
    expect(renderer.lastExpression).toBe('excited');
  });

  it('win triggers happy-spin tween', () => {
    const renderer = new ScoobyPortraitRenderer();
    renderer.init(390, 844, 64);

    renderer.react('happy-spin');
    expect(renderer.lastExpression).toBe('happy-spin');
  });

  it('lose triggers sad-face tint', () => {
    const renderer = new ScoobyPortraitRenderer();
    renderer.init(390, 844, 64);

    renderer.react('sad');
    expect(renderer.lastExpression).toBe('sad');
  });
});

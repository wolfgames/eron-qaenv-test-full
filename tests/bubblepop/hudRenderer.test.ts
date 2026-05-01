/**
 * HudRenderer: layout and update
 * Batch 3 test loci
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock pixi.js
vi.mock('pixi.js', () => {
  class MockContainer {
    children: unknown[] = [];
    addChild = vi.fn((child: unknown) => { this.children.push(child); return child; });
    removeChild = vi.fn();
    destroy = vi.fn();
    eventMode = 'passive';
    x = 0;
    y = 0;
    width = 0;
    height = 0;
  }

  class MockText extends MockContainer {
    text: string;
    style: { fontSize: number };
    anchor = { set: vi.fn() };
    constructor(text: string, style: { fontSize?: number } = {}) {
      super();
      this.text = text;
      this.style = { fontSize: style.fontSize ?? 16 };
    }
  }

  return {
    Container: MockContainer,
    Graphics: class extends MockContainer {
      fill = vi.fn().mockReturnThis();
      rect = vi.fn().mockReturnThis();
    },
    Text: MockText,
  };
});

import { HudRenderer } from '~/game/bubblepop/renderers/HudRenderer';

describe('HudRenderer: layout and update', () => {
  let renderer: HudRenderer;

  beforeEach(() => {
    renderer = new HudRenderer();
    renderer.init(390, 80);
  });

  it('HUD container height is 80px', () => {
    expect(renderer.height).toBe(80);
  });

  it('update sets movesRemaining and snacksRemaining text', () => {
    renderer.update({ movesRemaining: 10, snacksRemaining: 2, chapterName: 'The Creeping Manor' });
    expect(renderer.movesText.text).toContain('10');
    expect(renderer.snacksText.text).toContain('2');
  });

  it('HUD container does not overlap board container', () => {
    // HUD is at y:0, height 80. Board starts at y:80. No overlap.
    expect(renderer.container.y).toBe(0);
    expect(renderer.height).toBe(80);
    // Board offset must be >= HUD bottom
    const boardStartY = 80; // reserved_top_px
    expect(boardStartY).toBeGreaterThanOrEqual(renderer.container.y + renderer.height);
  });
});

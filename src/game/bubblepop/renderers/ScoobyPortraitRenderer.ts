/**
 * ScoobyPortraitRenderer — Scooby portrait (🐾 emoji) with reactive expressions.
 *
 * Positions: bottom-left within reservedBottom zone.
 * Expressions:
 *   excited   — GSAP scale 1.0 → 1.3 → 1.0 (300ms) for large pops (>=5 bubbles)
 *   happy-spin — GSAP rotation 360° (500ms) for win
 *   sad       — GSAP tint to 0x8888ff (400ms) for loss
 *   neutral   — default state
 *
 * GPU only — no DOM. Stays within reserved_bottom_px budget.
 */

import { Container, Text } from 'pixi.js';
import { gsap } from 'gsap';

export type Expression = 'neutral' | 'excited' | 'happy-spin' | 'sad';

export class ScoobyPortraitRenderer {
  readonly container: Container;
  private _portrait: Text;
  lastExpression: Expression = 'neutral';

  constructor() {
    this.container = new Container();
    this.container.eventMode = 'none';
    this._portrait = new Text('🐾', { fontSize: 48 });
  }

  /**
   * Initialize portrait at bottom-left within reserved zone.
   * @param viewportW - total viewport width
   * @param viewportH - total viewport height
   * @param reservedBottom - bottom reserved zone height (64px)
   */
  init(viewportW: number, viewportH: number, reservedBottom: number): void {
    void viewportW; // used for left-anchor positioning

    // Position at bottom-left — within reserved bottom zone
    this.container.x = 12;
    this.container.y = viewportH - reservedBottom - 4;

    this._portrait.anchor.set(0, 0.5);
    this._portrait.x = 0;
    this._portrait.y = 0;

    this.container.addChild(this._portrait);
  }

  /**
   * Trigger a reactive expression animation.
   */
  react(expression: Expression): void {
    this.lastExpression = expression;

    switch (expression) {
      case 'excited':
        // Scale up briefly then return — large pop reaction
        gsap.to(this._portrait, {
          pixi: { scale: 1.3 },
          duration: 0.15,
          onComplete: () => {
            gsap.to(this._portrait, { pixi: { scale: 1.0 }, duration: 0.15 });
          },
        });
        break;

      case 'happy-spin':
        // 360° rotation on win
        gsap.to(this._portrait, {
          rotation: Math.PI * 2,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => {
            this._portrait.rotation = 0;
          },
        });
        break;

      case 'sad':
        // Blue tint on loss
        gsap.to(this._portrait, {
          pixi: { tint: 0x8888ff },
          duration: 0.4,
        });
        break;

      case 'neutral':
        // Reset to default
        gsap.killTweensOf(this._portrait);
        gsap.to(this._portrait, {
          pixi: { tint: 0xffffff, scale: 1.0 },
          rotation: 0,
          duration: 0.2,
        });
        break;
    }
  }

  /**
   * Clean destroy.
   */
  destroy(): void {
    gsap.killTweensOf(this._portrait);
    this.container.removeAllListeners?.();
    this.container.destroy({ children: true });
  }
}

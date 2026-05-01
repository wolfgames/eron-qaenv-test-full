/**
 * SnackRenderer — renders Scooby Snack tiles on the board.
 *
 * Covered snack: dim 🦴 silhouette (alpha:0.35, tint grey).
 * Exposed snack collection: 400ms sparkle-rise animation flies to HUD counter.
 *
 * Renderer contract: no game state, no ECS queries. Receives data from GameController.
 */

import { Container, Text } from 'pixi.js';
import { gsap } from 'gsap';
import type { SnackCell } from '../state/types';

const CELL_PX = 53;
const GAP_PX = 3;

export interface SnackSprite {
  container: Container;
  snackCell: SnackCell;
}

export class SnackRenderer {
  readonly container: Container;
  private _sprites: Map<string, SnackSprite> = new Map();
  private _hudX: number = 0;
  private _hudY: number = 40;

  constructor() {
    this.container = new Container();
    this.container.eventMode = 'none';
  }

  /**
   * Initialize snack sprites from board snack data.
   */
  init(snacks: SnackCell[], reservedTop: number, hudSnackX: number, hudSnackY: number): void {
    this._hudX = hudSnackX;
    this._hudY = hudSnackY;
    this.container.y = reservedTop;

    for (const snack of snacks) {
      this._createSnackSprite(snack);
    }
  }

  private _createSnackSprite(snack: SnackCell): void {
    const sprite = new Container();
    sprite.x = snack.col * (CELL_PX + GAP_PX);
    sprite.y = snack.row * (CELL_PX + GAP_PX);

    // Dim silhouette — covered state
    const label = new Text('🦴', { fontSize: 32 });
    label.anchor.set(0.5, 0.5);
    label.x = CELL_PX / 2;
    label.y = CELL_PX / 2;
    label.alpha = 0.35;

    sprite.addChild(label);
    this.container.addChild(sprite);

    this._sprites.set(snack.entityId, { container: sprite, snackCell: snack });
  }

  /**
   * Play collection animation for a snack tile.
   * 400ms sparkle rise to HUD counter position.
   * @param entityId - the snack's entityId
   * @param onComplete - called when animation finishes (GameController decrements ECS)
   */
  playCollect(entityId: string, onComplete: () => void): void {
    const sprite = this._sprites.get(entityId);
    if (!sprite) {
      onComplete();
      return;
    }

    // Rise animation: parabolic arc to HUD snack counter
    gsap.to(sprite.container, {
      x: this._hudX,
      y: this._hudY - sprite.container.y, // relative to container's y offset
      pixi: { alpha: 0, scale: 0.5 },
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        gsap.killTweensOf(sprite.container);
        this.container.removeChild(sprite.container);
        sprite.container.destroy({ children: true });
        this._sprites.delete(entityId);
        onComplete();
      },
    });
  }

  /**
   * Update snack visibility (e.g. when board changes around snacks).
   */
  update(snacks: SnackCell[]): void {
    for (const snack of snacks) {
      const sprite = this._sprites.get(snack.entityId);
      if (!sprite) continue;

      const label = sprite.container.children[0] as Text;
      if (snack.covered) {
        label.alpha = 0.35;
      } else {
        label.alpha = 0.9; // exposed — fully visible
      }
    }
  }

  /**
   * Clean destroy.
   */
  destroy(): void {
    for (const sprite of this._sprites.values()) {
      gsap.killTweensOf(sprite.container);
      sprite.container.destroy({ children: true });
    }
    this._sprites.clear();
    this.container.destroy({ children: true });
  }
}

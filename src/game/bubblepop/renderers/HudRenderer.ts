/**
 * HudRenderer — renders the top HUD strip (chapter name, snack counter, move counter).
 *
 * Layout:
 *   y: 0, height: reservedTop (80px)
 *   Left: chapter name (14px)
 *   Center: snack emoji + count (18px bold)
 *   Right: move counter (22px bold)
 *
 * Renderer contract:
 *   init(viewportW, reservedTop) — creates HUD container
 *   update({movesRemaining, snacksRemaining, chapterName}) — updates text
 *   destroy() — tweens → removeChild → destroy
 */

import { Container, Text, Graphics } from 'pixi.js';
import { gsap } from 'gsap';

export class HudRenderer {
  readonly container: Container;
  readonly height: number;

  movesText: Text;
  snacksText: Text;
  scoreText: Text;
  private _chapterText: Text;
  private _bg: Graphics;

  constructor() {
    this.height = 80;
    this.container = new Container();
    this.container.eventMode = 'none';

    // Background strip
    this._bg = new Graphics();

    // Chapter name — left
    this._chapterText = new Text('', { fontSize: 14 });

    // Snack counter — center
    this.snacksText = new Text('', { fontSize: 18 });

    // Move counter — right
    this.movesText = new Text('', { fontSize: 22 });

    // Score — bottom of HUD strip
    this.scoreText = new Text('', { fontSize: 14 });
  }

  /**
   * Initialize the HUD at y:0.
   * @param viewportW - viewport width
   * @param reservedTop - HUD height (80px)
   */
  init(viewportW: number, reservedTop: number = 80): void {
    this.container.y = 0;
    this.container.x = 0;

    // Dark semi-transparent background for HUD
    this._bg.rect(0, 0, viewportW, reservedTop);
    this._bg.fill({ color: 0x1a1228, alpha: 0.85 });

    // Chapter name — left-aligned
    this._chapterText.x = 12;
    this._chapterText.y = reservedTop / 2 - 10;

    // Snack counter — centered
    this.snacksText.x = viewportW / 2 - 30;
    this.snacksText.y = reservedTop / 2 - 12;

    // Move counter — right-aligned
    this.movesText.x = viewportW - 60;
    this.movesText.y = reservedTop / 2 - 14;

    // Score — bottom of HUD, left-aligned below chapter name
    this.scoreText.x = 12;
    this.scoreText.y = reservedTop - 18;

    this.container.addChild(this._bg);
    this.container.addChild(this._chapterText);
    this.container.addChild(this.snacksText);
    this.container.addChild(this.movesText);
    this.container.addChild(this.scoreText);
  }

  /**
   * Update HUD text with current game state.
   */
  update({
    movesRemaining,
    snacksRemaining,
    chapterName,
    score,
  }: {
    movesRemaining: number;
    snacksRemaining: number;
    chapterName: string;
    score?: number;
  }): void {
    this._chapterText.text = chapterName;
    this.snacksText.text = `🦴 ×${snacksRemaining}`;
    this.movesText.text = `${movesRemaining}`;
    if (score !== undefined) {
      this.scoreText.text = `${score} pts`;
    }
  }

  /**
   * Flash the move counter (red pulse when moves get low).
   */
  flashMoves(): void {
    gsap.to(this.movesText, {
      pixi: { tint: 0xff4444 },
      duration: 0.15,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        gsap.to(this.movesText, { pixi: { tint: 0xffffff }, duration: 0.1 });
      },
    });
  }

  /**
   * Clean destroy.
   */
  destroy(): void {
    gsap.killTweensOf(this.movesText);
    gsap.killTweensOf(this.snacksText);
    this.container.destroy({ children: true });
  }
}

/**
 * BoardRenderer — renders the 7×9 grid of bubble cells in Pixi.
 *
 * Renderer contract:
 *   init(cells, viewportW, viewportH, reservedTop, reservedBottom) — creates grid
 *   syncBoard(newCells) — diff-based update; only changed entities animate
 *   destroy() — tweens → removeChild → destroy
 *
 * Cell size: floor((viewportW - 16) / 7) → 53px at 390px viewport.
 * Board y-offset: reservedTop (80px default).
 * Hit area: entire cell container (53×53px, eventMode='static').
 * Animation: GSAP; gravity drops keyed by entityId.
 */

import { Container } from 'pixi.js';
import { gsap } from 'gsap';
import type { BubbleCell } from '../state/types';
import { createBubbleSprite, type BubbleSprite } from './BubbleRenderer';

const COLS = 7;
const GAP_PX = 3;
const SIDE_MARGIN_PX = 8; // 8px each side

export class BoardRenderer {
  /** Main container — added to board layer in GameController. */
  readonly container: Container;

  /** Computed cell size in pixels. */
  cellPx: number = 53;

  /** Sprite map keyed by entityId for stable identity. */
  private _sprites: Map<string, BubbleSprite> = new Map();

  /** Previous cell state for diff computation. */
  private _prevCells: BubbleCell[] = [];

  private _reservedTop: number = 80;
  private _viewportW: number = 390;

  /** Optional tap callback; GameController wires this after init. */
  onTap?: (cell: BubbleCell) => void;

  constructor() {
    this.container = new Container();
    this.container.eventMode = 'passive';
  }

  /**
   * Initialize the board grid.
   * @param cells - array of BubbleCells from level data
   * @param viewportW - viewport width in px
   * @param viewportH - viewport height in px
   * @param reservedTop - reserved top zone height (80px HUD)
   * @param _reservedBottom - reserved bottom zone height (unused in board layout calc)
   */
  init(
    cells: BubbleCell[],
    viewportW: number,
    _viewportH: number,
    reservedTop: number = 80,
    _reservedBottom: number = 64,
  ): void {
    this._reservedTop = reservedTop;
    this._viewportW = viewportW;

    // Compute cell size: floor((viewportW - 2*sideMargin) / COLS)
    this.cellPx = Math.floor((viewportW - SIDE_MARGIN_PX * 2) / COLS);

    // Position board below HUD
    this.container.y = reservedTop;
    this.container.x = SIDE_MARGIN_PX;

    // Render all cells
    this._buildCells(cells);
    this._prevCells = [...cells];
  }

  private _buildCells(cells: BubbleCell[]): void {
    for (const cell of cells) {
      const sprite = this._createCellSprite(cell);
      this._sprites.set(cell.entityId, sprite);
      this.container.addChild(sprite.container);
    }
  }

  private _createCellSprite(cell: BubbleCell): BubbleSprite {
    const sprite = createBubbleSprite(cell.entityId, cell.flavor, this.cellPx);
    sprite.row = cell.row;
    sprite.col = cell.col;

    sprite.container.x = cell.col * (this.cellPx + GAP_PX);
    sprite.container.y = cell.row * (this.cellPx + GAP_PX);

    // Full cell is the tap target
    sprite.container.eventMode = 'static';
    sprite.container.hitArea = {
      contains: (x: number, y: number) => x >= 0 && y >= 0 && x <= this.cellPx && y <= this.cellPx,
    } as unknown as import('pixi.js').Rectangle;

    sprite.container.on('pointertap', () => {
      const cellData = this._prevCells.find((c) => c.entityId === cell.entityId);
      if (cellData && this.onTap) {
        this.onTap(cellData);
      }
    });

    return sprite;
  }

  /**
   * Update the board state with diff-based animation.
   * Only cells whose entityId changed position get GSAP tweens.
   * Unchanged cells are stationary.
   */
  syncBoard(newCells: BubbleCell[]): void {
    const prevMap = new Map<string, BubbleCell>();
    for (const c of this._prevCells) {
      prevMap.set(c.entityId, c);
    }

    const newMap = new Map<string, BubbleCell>();
    for (const c of newCells) {
      newMap.set(c.entityId, c);
    }

    // Animate moved cells
    for (const newCell of newCells) {
      const prev = prevMap.get(newCell.entityId);
      const sprite = this._sprites.get(newCell.entityId);
      if (!sprite) continue;

      if (prev && (prev.row !== newCell.row || prev.col !== newCell.col)) {
        // Position changed — animate drop
        const targetY = newCell.row * (this.cellPx + GAP_PX);
        const distance = Math.abs(newCell.row - prev.row);
        const duration = distance * 0.08;

        gsap.to(sprite.container, {
          y: targetY,
          duration,
          ease: 'power1.out',
          onComplete: () => {
            // Squash-bounce: magnitude scales with distance (clamp 0.55-0.75)
            const squashY = Math.max(0.55, 0.75 - (distance - 1) * 0.04);
            const bounceY = Math.min(1.25, 1.1 + (distance - 1) * 0.04);
            gsap.to(sprite.container.scale, {
              y: squashY,
              duration: 0.06,
              yoyo: true,
              repeat: 1,
              onComplete: () => {
                gsap.to(sprite.container.scale, { y: bounceY, duration: 0.06, onComplete: () => {
                  gsap.to(sprite.container.scale, { y: 1.0, duration: 0.05 });
                }});
              },
            });
          },
        });

        sprite.row = newCell.row;
        sprite.col = newCell.col;
      }
    }

    // Remove destroyed cells (popped)
    for (const [entityId, sprite] of this._sprites) {
      if (!newMap.has(entityId)) {
        gsap.killTweensOf(sprite.container);
        this.container.removeChild(sprite.container);
        sprite.container.destroy({ children: true });
        this._sprites.delete(entityId);
      }
    }

    // Add newly introduced cells (if any)
    for (const newCell of newCells) {
      if (!this._sprites.has(newCell.entityId)) {
        const sprite = this._createCellSprite(newCell);
        this._sprites.set(newCell.entityId, sprite);
        this.container.addChild(sprite.container);
      }
    }

    this._prevCells = [...newCells];
  }

  /**
   * Play pop burst animation on a set of cells.
   * Returns a Promise that resolves when all pops complete.
   */
  playPopBurst(cells: Array<{ row: number; col: number }>): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const pos of cells) {
      const cell = this._prevCells.find((c) => c.row === pos.row && c.col === pos.col);
      if (!cell) continue;
      const sprite = this._sprites.get(cell.entityId);
      if (!sprite) continue;

      promises.push(
        new Promise<void>((resolve) => {
          gsap.to(sprite.container, {
            pixi: { scaleX: 1.3, scaleY: 1.3, alpha: 0 },
            duration: 0.18,
            ease: 'power2.out',
            onComplete: resolve,
          });
        }),
      );
    }

    return Promise.all(promises).then(() => undefined);
  }

  /**
   * Play shake animation on a single cell (invalid tap feedback).
   */
  playShake(row: number, col: number): void {
    const cell = this._prevCells.find((c) => c.row === row && c.col === col);
    if (!cell) return;
    const sprite = this._sprites.get(cell.entityId);
    if (!sprite) return;

    const originalX = sprite.container.x;
    gsap.to(sprite.container, {
      x: originalX + 6,
      duration: 0.05,
      yoyo: true,
      repeat: 3,
      ease: 'elastic.out(1,0.3)',
      onComplete: () => {
        sprite.container.x = originalX;
      },
    });
  }

  /**
   * Highlight a cell immediately on pointerdown (< 100ms feedback).
   */
  highlightCell(row: number, col: number): void {
    const cell = this._prevCells.find((c) => c.row === row && c.col === col);
    if (!cell) return;
    const sprite = this._sprites.get(cell.entityId);
    if (!sprite) return;

    gsap.to(sprite.container.scale, { x: 1.08, y: 1.08, duration: 0.05 });
  }

  /**
   * Clear highlight on a cell.
   */
  clearHighlight(row: number, col: number): void {
    const cell = this._prevCells.find((c) => c.row === row && c.col === col);
    if (!cell) return;
    const sprite = this._sprites.get(cell.entityId);
    if (!sprite) return;

    gsap.to(sprite.container.scale, { x: 1.0, y: 1.0, duration: 0.05 });
  }

  /**
   * Get the board cell at a given local (x, y) coordinate.
   */
  getCellAtLocal(localX: number, localY: number): BubbleCell | null {
    const col = Math.floor(localX / (this.cellPx + GAP_PX));
    const row = Math.floor(localY / (this.cellPx + GAP_PX));
    return this._prevCells.find((c) => c.row === row && c.col === col) ?? null;
  }

  /**
   * Clean destroy: tweens → removeChild → destroy.
   */
  destroy(): void {
    for (const sprite of this._sprites.values()) {
      gsap.killTweensOf(sprite.container);
      gsap.killTweensOf(sprite.container.scale);
      sprite.container.removeAllListeners?.();
      sprite.container.destroy({ children: true });
    }
    this._sprites.clear();
    this.container.removeAllListeners?.();
    this.container.destroy({ children: true });
  }
}

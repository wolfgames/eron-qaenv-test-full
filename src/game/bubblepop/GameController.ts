/**
 * BubblePop GameController
 *
 * Central integration point — wires ECS, Pixi Application, all renderers, and input routing.
 * Lifecycle: init() → game runs → destroy()
 *
 * Destroy order (guardrail #18): GSAP tweens → Pixi app → ECS bridge → setActiveDb(null)
 *
 * Wiring sequence (init):
 *   1. ECS DB created → setActiveDb → bridgeEcsToSignals
 *   2. Pixi Application initialized → 4 Container layers
 *   3. Renderers instantiated (HudRenderer, BoardRenderer, SnackRenderer, ScoobyPortraitRenderer)
 *   4. TapHandler wired to board layer pointertap
 *   5. WinLoseDetector wired to check after each tap resolves
 */

import { Application, Container } from 'pixi.js';
import { createSignal } from 'solid-js';
import { gsap } from 'gsap';
import { Database } from '@adobe/data/ecs';
import { setActiveDb } from '~/core/systems/ecs';
import type { GameControllerDeps, GameController } from '~/game/mygame-contract';
import { bubblePopPlugin, type BubblePopDatabase } from './state/BubblePopPlugin';
import { bridgeEcsToSignals } from './state/bridgeEcsToSignals';
import { gameState } from '~/game/state';
import { BoardRenderer } from './renderers/BoardRenderer';
import { HudRenderer } from './renderers/HudRenderer';
import { SnackRenderer } from './renderers/SnackRenderer';
import { ScoobyPortraitRenderer } from './renderers/ScoobyPortraitRenderer';
import { TapHandler } from './logic/tapHandler';
import { WinLoseDetector } from './logic/winLoseDetector';
import { checkSnackCollection } from './logic/snackLogic';
import { computePopScore } from './logic/scoringLogic';
import type { BoardState, BubbleCell, SnackCell } from './state/types';

// Reserved layout zones
const RESERVED_TOP_PX = 80;
const RESERVED_BOTTOM_PX = 64;

export interface BubblePopLayers {
  bg: Container;
  board: Container;
  hud: Container;
  ui: Container;
}

export interface BubblePopGameControllerOptions {
  goto?: (screen: string) => void;
}

export interface BubblePopGameControllerInstance extends GameController {
  layers: BubblePopLayers;
}

export const BubblePopGameController = {
  create(deps: GameControllerDeps, options?: BubblePopGameControllerOptions): BubblePopGameControllerInstance {
    const gotoScreen = options?.goto;
    const [ariaText, setAriaText] = createSignal('BubblePop loading...');
    let app: Application | null = null;
    let ecsDb: BubblePopDatabase | null = null;
    let cleanupObserve: (() => void) | null = null;

    // Renderers (created in init)
    let boardRenderer: BoardRenderer | null = null;
    let hudRenderer: HudRenderer | null = null;
    let snackRenderer: SnackRenderer | null = null;
    let portraitRenderer: ScoobyPortraitRenderer | null = null;

    // Logic controllers
    let tapHandler: TapHandler | null = null;
    let winLoseDetector: WinLoseDetector | null = null;

    // Runtime board state (synced from ECS after each transaction)
    let currentBoard: BoardState = { cols: 7, rows: 9, cells: [], snacks: [] };
    let moveLimit = 35;
    let isAnimating = false;

    const layers: BubblePopLayers = {
      bg: new Container(),
      board: new Container(),
      hud: new Container(),
      ui: new Container(),
    };

    /**
     * Sync board state from ECS resources and re-read cells.
     * Called after each transaction to keep local mirror current.
     */
    function readBoardFromEcs(): BoardState {
      if (!ecsDb) return currentBoard;
      const cells: Array<BubbleCell | null> = new Array(currentBoard.cols * currentBoard.rows).fill(null);
      for (const entity of ecsDb.select(['row', 'col', 'flavor', 'entityId'] as const)) {
        const d = ecsDb.read(entity);
        if (d && d.row !== undefined && d.col !== undefined && d.flavor !== undefined && d.entityId !== undefined) {
          const idx = (d.row as number) * currentBoard.cols + (d.col as number);
          cells[idx] = { row: d.row as number, col: d.col as number, flavor: d.flavor as import('./state/types').Flavor, entityId: d.entityId as string };
        }
      }
      const snacks: SnackCell[] = [];
      for (const entity of ecsDb.select(['row', 'col', 'covered', 'entityId'] as const)) {
        const d = ecsDb.read(entity);
        if (d && d.row !== undefined && d.col !== undefined && d.covered !== undefined && d.entityId !== undefined) {
          snacks.push({ row: d.row as number, col: d.col as number, covered: d.covered as boolean, entityId: d.entityId as string });
        }
      }
      return { cols: currentBoard.cols, rows: currentBoard.rows, cells, snacks };
    }

    /**
     * Handle a valid tap — pop group, animate, check snacks, check win/lose.
     */
    async function handleValidTap({ group }: { pos: { row: number; col: number }; group: BubbleCell[] }): Promise<void> {
      if (!ecsDb || !boardRenderer || !hudRenderer || !snackRenderer || !portraitRenderer || !winLoseDetector) return;

      isAnimating = true;
      ecsDb.transactions.setState({ phase: 'animating' });

      // Score
      const popScore = computePopScore(group.length);
      ecsDb.transactions.addScore({ amount: popScore });
      ecsDb.transactions.decrementMoves();

      // Read move limit count before decrement: use initial moveLimit
      const movesNow = ecsDb.resources.movesRemaining;

      // Pop animation
      if (group.length >= 5) portraitRenderer.react('excited');
      await boardRenderer.playPopBurst(group.map((c) => ({ row: c.row, col: c.col })));

      // Update board from ECS (replaceBoard was called in action, but action removed group)
      // We need to apply the removal ourselves since we're not using executeTap action
      // Remove group cells from board — use current mirror and filter
      const groupEntityIds = new Set(group.map((c) => c.entityId));

      // Read remaining cells from current board mirror (those not in the popped group)
      const remainingCells: BubbleCell[] = currentBoard.cells
        .filter((c): c is BubbleCell => c !== null && !groupEntityIds.has(c.entityId));

      // Apply gravity to remaining cells
      const { applyGravity } = await import('./logic/gravityFill');
      const boardAfterPop: BoardState = {
        cols: currentBoard.cols,
        rows: currentBoard.rows,
        cells: new Array(currentBoard.cols * currentBoard.rows).fill(null),
        snacks: currentBoard.snacks,
      };
      for (const c of remainingCells) {
        boardAfterPop.cells[c.row * currentBoard.cols + c.col] = c;
      }
      const { after: boardAfterGravity } = applyGravity(boardAfterPop);

      // Commit board to ECS
      const cellsForEcs = boardAfterGravity.cells
        .filter((c): c is BubbleCell => c !== null)
        .map((c) => ({ row: c.row, col: c.col, flavor: c.flavor, entityId: c.entityId }));

      ecsDb.transactions.replaceBoard({ cells: cellsForEcs });

      // Update local mirror
      currentBoard = boardAfterGravity;

      // Sync board renderer
      boardRenderer.syncBoard(cellsForEcs as BubbleCell[]);

      // Wait for gravity animations
      await new Promise<void>((r) => gsap.delayedCall(0.35, r));

      // Check snack collection
      const exposedSnacks = checkSnackCollection(currentBoard);
      for (const snack of exposedSnacks) {
        await new Promise<void>((resolve) => {
          snackRenderer!.playCollect(snack.entityId, () => {
            ecsDb!.transactions.collectSnack({ row: snack.row, col: snack.col });
            resolve();
          });
        });
      }

      // Update snack renderer visibility
      snackRenderer.update(currentBoard.snacks);

      // Update HUD
      const snacksNow = ecsDb.resources.snacksRemaining;
      const scoreNow = ecsDb.resources.score;
      hudRenderer.update({
        movesRemaining: movesNow,
        snacksRemaining: snacksNow,
        chapterName: 'Creeping Manor',
        score: scoreNow,
      });
      if (movesNow <= 5) hudRenderer.flashMoves();

      // Bridge signals
      gameState.setMovesRemaining(movesNow);
      gameState.setSnacksRemaining(snacksNow);

      // Win/lose check
      winLoseDetector.check({
        snacksRemaining: snacksNow,
        movesRemaining: movesNow,
      });

      isAnimating = false;
      ecsDb.transactions.setState({ phase: 'idle' });

      // Drain queued taps
      tapHandler?.drainQueue();
    }

    /**
     * Handle invalid tap — shake feedback.
     */
    function handleInvalidTap(pos: { row: number; col: number }): void {
      boardRenderer?.playShake(pos.row, pos.col);
    }

    return {
      gameMode: 'pixi' as const,
      layers,
      ariaText,

      async init(container: HTMLDivElement) {
        setAriaText('BubblePop Game');

        // 1. Create ECS DB → setActiveDb → bridge
        ecsDb = Database.create(bubblePopPlugin) as BubblePopDatabase;
        setActiveDb(ecsDb as Parameters<typeof setActiveDb>[0]);
        cleanupObserve = bridgeEcsToSignals(ecsDb);

        // 2. Init Pixi Application
        app = new Application();
        const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio ?? 1) : 1;
        await app.init({
          resizeTo: container,
          resolution: Math.min(dpr, 2),
          background: '#1a1228',
          autoDensity: true,
        });
        container.appendChild(app.canvas as HTMLCanvasElement);

        // 3. Create layer stack
        layers.bg = new Container();
        layers.board = new Container();
        layers.hud = new Container();
        layers.ui = new Container();

        // Set event modes — board layer has interactive children (passive propagates)
        layers.bg.eventMode = 'none';
        layers.board.eventMode = 'passive';
        layers.hud.eventMode = 'none';
        layers.ui.eventMode = 'passive';

        app.stage.eventMode = 'static';
        app.stage.addChild(layers.bg);
        app.stage.addChild(layers.board);
        app.stage.addChild(layers.hud);
        app.stage.addChild(layers.ui);

        // 4. Set layout offsets — board starts below HUD
        layers.board.y = RESERVED_TOP_PX;
        layers.hud.y = 0;

        // Wait for first frame so screen dimensions are settled
        await new Promise<void>((resolve) => {
          app!.ticker.addOnce(() => resolve());
        });

        const viewportW = app.screen.width || 390;
        const viewportH = app.screen.height || 844;

        // 5. Load level data
        let levelData: {
          cols: number;
          rows: number;
          cells: Array<{ row: number; col: number; flavor: string }>;
          snacks: Array<{ row: number; col: number }>;
          moveLimit: number;
          snackCount: number;
          chapterName: string;
        } | null = null;

        try {
          const levels = (await import('./data/hand-crafted-levels.json')).default;
          const levelIndex = (gameState.level() - 1) % (levels as typeof levels).length;
          const level = (levels as typeof levels)[levelIndex];
          if (level) {
            // JSON uses `board` for bubble cells; `cells` is the runtime name
            const rawBoard = (level as { board?: Array<{ row: number; col: number; flavor: string }> }).board ?? [];
            levelData = {
              cols: level.cols ?? 7,
              rows: level.rows ?? 9,
              cells: rawBoard,
              snacks: (level as { snacks?: Array<{ row: number; col: number }> }).snacks ?? [],
              moveLimit: (level as { moveLimit?: number }).moveLimit ?? 35,
              snackCount: (level as { snackCount?: number }).snackCount ?? 3,
              chapterName: (level as { chapterName?: string }).chapterName ?? 'The Creeping Manor',
            };
          }
        } catch {
          // Level data not available — use defaults
        }

        const cols = levelData?.cols ?? 7;
        const rows = levelData?.rows ?? 9;
        moveLimit = levelData?.moveLimit ?? 35;
        const snackCount = levelData?.snackCount ?? 3;

        // Build initial board state
        const initialCells: BubbleCell[] = [];
        if (levelData?.cells && levelData.cells.length > 0) {
          for (let i = 0; i < levelData.cells.length; i++) {
            const c = levelData.cells[i];
            initialCells.push({ row: c.row, col: c.col, flavor: c.flavor as import('./state/types').Flavor, entityId: `b-${c.row}-${c.col}` });
          }
        } else {
          // Fallback: fill grid with bone/pizza/burger
          const flavors: import('./state/types').Flavor[] = ['bone', 'pizza', 'burger'];
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              initialCells.push({ row: r, col: c, flavor: flavors[(r + c) % flavors.length], entityId: `b-${r}-${c}` });
            }
          }
        }

        const initialSnacks: SnackCell[] = levelData?.snacks?.map((s, i) => ({
          row: s.row, col: s.col, covered: true, entityId: `snack-${i}`,
        })) ?? [
          { row: 8, col: 1, covered: true, entityId: 'snack-0' },
          { row: 8, col: 3, covered: true, entityId: 'snack-1' },
          { row: 8, col: 5, covered: true, entityId: 'snack-2' },
        ];

        currentBoard = {
          cols,
          rows,
          cells: new Array(cols * rows).fill(null),
          snacks: initialSnacks,
        };
        for (const c of initialCells) {
          currentBoard.cells[c.row * cols + c.col] = c;
        }

        // 6. Initialize ECS resources from level
        ecsDb.transactions.resetGame({ moveLimit, snackCount });
        ecsDb.transactions.replaceBoard({ cells: initialCells.map((c) => ({ row: c.row, col: c.col, flavor: c.flavor, entityId: c.entityId })) });

        // 7. Initialize renderers
        hudRenderer = new HudRenderer();
        hudRenderer.init(viewportW, RESERVED_TOP_PX);
        hudRenderer.update({ movesRemaining: moveLimit, snacksRemaining: snackCount, chapterName: levelData?.chapterName ?? 'The Creeping Manor' });
        layers.hud.addChild(hudRenderer.container);

        boardRenderer = new BoardRenderer();
        boardRenderer.init(initialCells, viewportW, viewportH, RESERVED_TOP_PX, RESERVED_BOTTOM_PX);
        layers.board.addChild(boardRenderer.container);

        snackRenderer = new SnackRenderer();
        const hudSnackX = viewportW / 2;
        const hudSnackY = 40;
        snackRenderer.init(initialSnacks, RESERVED_TOP_PX, hudSnackX, hudSnackY);
        layers.board.addChild(snackRenderer.container);

        portraitRenderer = new ScoobyPortraitRenderer();
        portraitRenderer.init(viewportW, viewportH, RESERVED_BOTTOM_PX);
        layers.ui.addChild(portraitRenderer.container);

        // 8. Wire win/lose detector
        winLoseDetector = new WinLoseDetector({
          moveLimit,
          onWin: ({ stars }) => {
            ecsDb!.transactions.setState({ phase: 'won' });
            ecsDb!.transactions.setStars({ stars: stars ?? 1 });
            gameState.setWin(true);
            gameState.setStars(stars ?? 1);
            portraitRenderer!.react('happy-spin');
            // Navigate to results after brief delay
            gsap.delayedCall(1.0, () => {
              gotoScreen?.('results');
            });
          },
          onLose: () => {
            ecsDb!.transactions.setState({ phase: 'lost' });
            gameState.setWin(false);
            portraitRenderer!.react('sad');
            gsap.delayedCall(1.0, () => {
              gotoScreen?.('results');
            });
          },
        });

        // 9. Wire tap handler to board renderer
        tapHandler = new TapHandler({
          getBoard: () => currentBoard,
          getPhase: () => (isAnimating ? 'animating' : 'idle'),
          onValidTap: (result) => {
            void handleValidTap(result);
          },
          onInvalidTap: handleInvalidTap,
        });

        boardRenderer.onTap = (cell: BubbleCell) => {
          tapHandler!.handleTap({ row: cell.row, col: cell.col });
        };

        // Bridge remaining signals
        gameState.setMovesRemaining(moveLimit);
        gameState.setSnacksRemaining(snackCount);
        gameState.setChapterName('Creeping Manor');
      },

      destroy() {
        // Destroy order: GSAP tweens → renderers → Pixi app → ECS bridge → setActiveDb(null)

        // Kill all renderer tweens first
        if (boardRenderer) {
          boardRenderer.destroy();
          boardRenderer = null;
        }
        if (hudRenderer) {
          hudRenderer.destroy();
          hudRenderer = null;
        }
        if (snackRenderer) {
          snackRenderer.destroy();
          snackRenderer = null;
        }
        if (portraitRenderer) {
          portraitRenderer.destroy();
          portraitRenderer = null;
        }

        // Kill layer tweens
        gsap.killTweensOf(layers.bg);
        gsap.killTweensOf(layers.board);
        gsap.killTweensOf(layers.hud);
        gsap.killTweensOf(layers.ui);

        tapHandler = null;
        winLoseDetector = null;

        if (app) {
          app.destroy(true, { children: true });
          app = null;
        }

        if (cleanupObserve) {
          cleanupObserve();
          cleanupObserve = null;
        }

        setActiveDb(null);
        ecsDb = null;

        // Reset DOM-bridge signals
        gameState.reset();
      },
    };
  },
};

// Expose reserved zones as constants for renderers
export { RESERVED_TOP_PX, RESERVED_BOTTOM_PX };

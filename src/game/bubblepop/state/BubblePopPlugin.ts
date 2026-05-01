/**
 * BubblePop ECS Plugin
 *
 * Source of truth for all BubblePop game state.
 * Property order: extends → services → components → resources → archetypes → computed → transactions → actions → systems
 */

import { Database } from '@adobe/data/ecs';
import type { BoardPhase, Flavor, BoardState, CellPosition } from './types';
import { findConnectedGroup, removeGroup, applyGravity } from '../logic/boardLogic';

// ─── Component schemas ───────────────────────────────────────────────────────

const BubbleCellComponents = {
  row: { default: 0 as number },
  col: { default: 0 as number },
  flavor: { default: 'bone' as Flavor },
  entityId: { default: '' as string },
};

const ScoobySnackCellComponents = {
  row: { default: 0 as number },
  col: { default: 0 as number },
  covered: { default: true as boolean },
  entityId: { default: '' as string },
};

// ─── Plugin ──────────────────────────────────────────────────────────────────

export const bubblePopPlugin = Database.Plugin.create({
  components: {
    ...BubbleCellComponents,
    ...ScoobySnackCellComponents,
  },

  resources: {
    score: { default: 0 as number },
    movesRemaining: { default: 35 as number },
    snacksRemaining: { default: 3 as number },
    starsEarned: { default: 0 as number },
    boardPhase: { default: 'idle' as BoardPhase },
  },

  archetypes: {
    BubbleCell: ['row', 'col', 'flavor', 'entityId'] as const,
    ScoobySnackCell: ['row', 'col', 'covered', 'entityId'] as const,
  },

  transactions: {
    replaceBoard(store, { cells }: { cells: Array<{ row: number; col: number; flavor: Flavor; entityId: string }> }) {
      // Clear all existing BubbleCell entities
      const existing = [...store.select(['row', 'col', 'flavor', 'entityId'] as const)];
      for (const entity of existing) {
        store.delete(entity);
      }
      // Insert new cells
      for (const cell of cells) {
        store.archetypes.BubbleCell.insert({
          row: cell.row,
          col: cell.col,
          flavor: cell.flavor,
          entityId: cell.entityId,
        });
      }
    },

    addScore(store, { amount }: { amount: number }) {
      store.resources.score = store.resources.score + amount;
    },

    decrementMoves(store) {
      store.resources.movesRemaining = store.resources.movesRemaining - 1;
    },

    collectSnack(store, { row, col }: { row: number; col: number }) {
      // Mark snack as collected (remove from board) and decrement counter
      const snacks = [...store.select(['row', 'col', 'covered', 'entityId'] as const)];
      for (const entity of snacks) {
        const data = store.read(entity);
        if (data && data.row === row && data.col === col) {
          store.delete(entity);
          break;
        }
      }
      if (store.resources.snacksRemaining > 0) {
        store.resources.snacksRemaining = store.resources.snacksRemaining - 1;
      }
    },

    setState(store, { phase }: { phase: BoardPhase }) {
      store.resources.boardPhase = phase;
    },

    setStars(store, { stars }: { stars: number }) {
      store.resources.starsEarned = stars;
    },

    resetGame(store, { moveLimit, snackCount }: { moveLimit: number; snackCount: number }) {
      store.resources.score = 0;
      store.resources.movesRemaining = moveLimit;
      store.resources.snacksRemaining = snackCount;
      store.resources.starsEarned = 0;
      store.resources.boardPhase = 'idle';
    },
  },

  actions: {
    executeTap(
      db: ReturnType<typeof Database.create>,
      payload: { row: number; col: number; rng: () => number; board: BoardState },
    ): { group: Array<{ row: number; col: number }>; popScore: number; animationEvents: AnimationEventPayload[] } {
      const { row, col, board } = payload;
      const pos: CellPosition = { row, col };

      // Find connected group using pure board logic
      const group = findConnectedGroup(board, pos);
      if (group.length < 2) {
        // Invalid tap — controller handles feedback
        return { group, popScore: 0, animationEvents: [] };
      }

      // Remove group from board
      const afterPop = removeGroup(board, group);

      // Apply gravity
      const { after: afterGravity, diffs } = applyGravity(afterPop);

      // Commit to ECS via transactions
      (db as BubblePopDatabase).transactions.replaceBoard({
        cells: afterGravity.cells
          .filter((c): c is NonNullable<typeof c> => c !== null)
          .map((c) => ({ row: c.row, col: c.col, flavor: c.flavor, entityId: c.entityId })),
      });

      const animationEvents: AnimationEventPayload[] = [
        { type: 'pop', cells: group.map((c) => ({ row: c.row, col: c.col })) },
        { type: 'gravity-drop', diffs },
      ];

      return { group, popScore: (group.length - 1) * 100, animationEvents };
    },
  },
});

export type BubblePopDatabase = Database.FromPlugin<typeof bubblePopPlugin>;

// Internal type for action return
type AnimationEventPayload = {
  type: string;
  cells?: Array<{ row: number; col: number }>;
  diffs?: import('./types').GravityDiff[];
};

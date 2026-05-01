/**
 * ECS Plugin — resources and transactions
 * Batch 1 test loci
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Database } from '@adobe/data/ecs';
import { bubblePopPlugin } from '~/game/bubblepop/state/BubblePopPlugin';

describe('ECS Plugin — resources and transactions', () => {
  let db: Database.FromPlugin<typeof bubblePopPlugin>;

  beforeEach(() => {
    db = Database.create(bubblePopPlugin);
  });

  it('resources registered: score, movesRemaining, snacksRemaining, starsEarned, boardPhase', () => {
    expect(db.resources.score).toBe(0);
    expect(db.resources.movesRemaining).toBe(35);
    expect(db.resources.snacksRemaining).toBe(3);
    expect(db.resources.starsEarned).toBe(0);
    expect(db.resources.boardPhase).toBe('idle');
  });

  it('replaceBoard deletes prior cells and inserts new board', () => {
    // Insert initial cells
    db.transactions.replaceBoard({
      cells: [
        { row: 0, col: 0, flavor: 'bone', entityId: 'e1' },
        { row: 0, col: 1, flavor: 'pizza', entityId: 'e2' },
      ],
    });
    const countAfterFirst = [...db.select(['row', 'col', 'flavor', 'entityId'] as const)].length;
    expect(countAfterFirst).toBe(2);

    // Replace with different cells
    db.transactions.replaceBoard({
      cells: [
        { row: 1, col: 0, flavor: 'burger', entityId: 'e3' },
      ],
    });
    const entities = [...db.select(['row', 'col', 'flavor', 'entityId'] as const)];
    expect(entities).toHaveLength(1);
    const data = db.read(entities[0]);
    expect(data?.row).toBe(1);
    expect(data?.col).toBe(0);
    expect(data?.flavor).toBe('burger');
    expect(data?.entityId).toBe('e3');
  });

  it('addScore increments score resource', () => {
    expect(db.resources.score).toBe(0);
    db.transactions.addScore({ amount: 100 });
    expect(db.resources.score).toBe(100);
    db.transactions.addScore({ amount: 250 });
    expect(db.resources.score).toBe(350);
  });

  it('decrementMoves decrements movesRemaining', () => {
    expect(db.resources.movesRemaining).toBe(35);
    db.transactions.decrementMoves();
    expect(db.resources.movesRemaining).toBe(34);
    db.transactions.decrementMoves();
    expect(db.resources.movesRemaining).toBe(33);
  });
});

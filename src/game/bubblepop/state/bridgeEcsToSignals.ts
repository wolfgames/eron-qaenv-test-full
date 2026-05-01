/**
 * Bridge ECS resources to SolidJS gameState signals.
 *
 * Subscribes to ECS resource observables and updates gameState signals
 * so DOM screens (ResultsScreen, etc.) can react to game state.
 *
 * Observe<T> is a function: observe(notify) => unobserve
 * Returns a cleanup function. Call it before setActiveDb(null).
 */

import type { BubblePopDatabase } from './BubblePopPlugin';
import { gameState } from '~/game/state';

export function bridgeEcsToSignals(db: BubblePopDatabase): () => void {
  // Observe<T> is called as a function: db.observe.resources.score(notify) => unobserve
  const scoreUnsub = db.observe.resources.score((score: number) => {
    gameState.setScore(score);
  });

  const movesUnsub = db.observe.resources.movesRemaining((moves: number) => {
    gameState.setMovesRemaining(moves);
  });

  const snacksUnsub = db.observe.resources.snacksRemaining((snacks: number) => {
    gameState.setSnacksRemaining(snacks);
  });

  const starsUnsub = db.observe.resources.starsEarned((stars: number) => {
    if (stars >= 1 && stars <= 3) {
      gameState.setStars(stars as 1 | 2 | 3);
    }
  });

  return () => {
    scoreUnsub?.();
    movesUnsub?.();
    snacksUnsub?.();
    starsUnsub?.();
  };
}

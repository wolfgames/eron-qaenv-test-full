/**
 * Scoring Logic — pure functions for BubblePop score calculation.
 *
 * Formula (multiplicative, per CoS scoring):
 *   popScore = (groupSize - 1) * 100           // 2=100, 5=400, 10=900
 *   cascadeMultiplier = cascadeDepth + 1        // 0=x1, 1=x2, 2=x3...
 *   moveEfficiency = moveLimitTotal / movesUsed // ≥1.0; rewards fewer moves
 *   levelScore = round(popScore * cascadeMultiplier * moveEfficiency)
 *
 * No Math.random. No Pixi. No DOM. Pure math.
 */

/**
 * Compute the base pop score for a group pop.
 * popScore = (groupSize - 1) * 100
 */
export function computePopScore(groupSize: number): number {
  return (groupSize - 1) * 100;
}

/**
 * Compute the cascade multiplier for a cascade at the given depth.
 * cascadeMultiplier = cascadeDepth + 1
 * @param cascadeDepth - 0 for a flat pop (no cascade), 1 for first cascade, etc.
 */
export function computeCascadeMultiplier(cascadeDepth: number): number {
  return cascadeDepth + 1;
}

/**
 * Compute the move efficiency multiplier.
 * moveEfficiency = moveLimitTotal / movesUsed
 * Rewards players who finish the level with moves remaining.
 * @param moveLimitTotal - total moves allowed for the level
 * @param movesUsed - how many moves the player actually used
 */
export function computeMoveEfficiency(moveLimitTotal: number, movesUsed: number): number {
  if (movesUsed <= 0) return moveLimitTotal; // edge case
  return moveLimitTotal / movesUsed;
}

/**
 * Compute the final level score.
 * levelScore = round(popScore * cascadeMultiplier * moveEfficiency)
 */
export function computeLevelScore(
  popScore: number,
  cascadeMultiplier: number,
  moveEfficiency: number,
): number {
  return Math.round(popScore * cascadeMultiplier * moveEfficiency);
}

/**
 * Compute star rating based on moves remaining at win.
 * 3 stars: movesRemaining / moveLimit > 0.5
 * 2 stars: 0.2 – 0.5
 * 1 star: < 0.2
 */
export function computeStars(movesRemaining: number, moveLimit: number): 1 | 2 | 3 {
  const ratio = movesRemaining / moveLimit;
  if (ratio > 0.5) return 3;
  if (ratio >= 0.2) return 2;
  return 1;
}

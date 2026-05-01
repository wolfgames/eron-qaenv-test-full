/**
 * scoring: formula dimensions
 * Batch 4 test loci
 */
import { describe, it, expect } from 'vitest';
import {
  computePopScore,
  computeCascadeMultiplier,
  computeMoveEfficiency,
  computeLevelScore,
} from '~/game/bubblepop/logic/scoringLogic';

describe('scoring: formula dimensions', () => {
  it('popScore is (groupSize-1)*100', () => {
    expect(computePopScore(2)).toBe(100);
    expect(computePopScore(5)).toBe(400);
    expect(computePopScore(10)).toBe(900);
  });

  it('cascadeMultiplier is cascadeDepth+1', () => {
    expect(computeCascadeMultiplier(0)).toBe(1);  // no cascade
    expect(computeCascadeMultiplier(1)).toBe(2);  // first cascade
    expect(computeCascadeMultiplier(2)).toBe(3);  // second cascade
  });

  it('moveEfficiency is moveLimitTotal/movesUsed', () => {
    // Perfect play: 35 moves limit, used 35
    expect(computeMoveEfficiency(35, 35)).toBeCloseTo(1.0, 2);
    // Efficient: used 20 out of 35
    expect(computeMoveEfficiency(35, 20)).toBeCloseTo(1.75, 2);
    // Edge case: used 1 out of 35
    expect(computeMoveEfficiency(35, 1)).toBeCloseTo(35.0, 2);
  });

  it('skilled player score is >= 3× beginner score on same level', () => {
    // Beginner: 3-groups, no cascades, used all 35 moves
    const beginnerScore = computeLevelScore(computePopScore(3), computeCascadeMultiplier(0), computeMoveEfficiency(35, 35));

    // Skilled: 5-groups, cascades at depth 2, used only 15 moves out of 35
    const skilledScore = computeLevelScore(computePopScore(5), computeCascadeMultiplier(2), computeMoveEfficiency(35, 15));

    expect(skilledScore).toBeGreaterThanOrEqual(beginnerScore * 3);
  });

  it('score is multiplicative not additive (base * cascade * efficiency)', () => {
    const base = computePopScore(5);       // 400
    const cascade = computeCascadeMultiplier(1); // 2
    const efficiency = computeMoveEfficiency(35, 20); // 1.75

    const score = computeLevelScore(base, cascade, efficiency);
    const addedScore = base + cascade + efficiency;

    // Multiplicative score >> additive for large inputs
    expect(score).toBeGreaterThan(addedScore);

    // Verify formula: score = round(base * cascade * efficiency)
    expect(score).toBeCloseTo(Math.round(base * cascade * efficiency), 0);
  });
});

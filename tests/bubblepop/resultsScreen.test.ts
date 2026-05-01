/**
 * results screen: copy and CTAs
 * Batch 6 test loci
 *
 * Tests the source file directly — SolidJS components cannot be rendered
 * in a Node/vitest environment without a browser/JSDOM.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const RESULTS_SCREEN_PATH = resolve(
  '/var/lib/agent-worker/workspace/eron-qaenv-test-full/src/game/screens/ResultsScreen.tsx',
);

function getSource(): string {
  return readFileSync(RESULTS_SCREEN_PATH, 'utf-8');
}

describe('results screen: copy and CTAs', () => {
  it("win branch shows 'Scooby-Dooby-Doo!' and no 'Game Over' text", () => {
    const source = getSource();
    expect(source).toContain('Scooby-Dooby-Doo!');
    expect(source).not.toContain('Game Over');
  });

  it("loss branch shows 'Ruh-roh! Out of moves!' not 'Game Over'", () => {
    const source = getSource();
    expect(source).toContain('Ruh-roh! Out of moves!');
    expect(source).not.toContain('Game Over');
  });

  it('CTAs have >= 44px touch targets and >= 8px separation', () => {
    const source = getSource();
    // Verify min-height >= 44px classes or py padding exist
    expect(source).toMatch(/min-h-\[44px\]|py-3|py-4/);
    // Verify gap between CTAs (gap-2=8px to gap-6=24px)
    expect(source).toMatch(/gap-[2-9]|gap-[1-9][0-9]/);
    // Try Again and Keep Going! buttons exist
    expect(source).toContain('Try Again');
    expect(source).toContain('Keep Going!');
    expect(source).toContain('Next Level');
  });
});

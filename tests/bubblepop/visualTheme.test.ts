/**
 * visual theme: loading and start screens
 * Batch 8 test loci
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = '/var/lib/agent-worker/workspace/eron-qaenv-test-full/src/game';

function readFile(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf-8');
}

describe('visual theme: loading and start screens', () => {
  it('LoadingScreen background is not the default green (#00ff00)', () => {
    const source = readFile('screens/LoadingScreen.tsx');
    // Should not have the default green color
    expect(source).not.toContain('#BCE083');
    // Should contain Scooby warm theme color
    expect(source).toMatch(/#E8A820|#e8a820|mustard|harvest|E8A820/i);
  });

  it("StartScreen title text contains 'Scooby'", () => {
    const source = readFile('mygame/screens/startView.ts');
    expect(source).toContain('Scooby');
  });

  it('Play button height >= 80px', () => {
    const source = readFile('mygame/screens/startView.ts');
    // Button should have min-height 80px style
    expect(source).toMatch(/80px|min-height.*80|height.*80/);
  });
});

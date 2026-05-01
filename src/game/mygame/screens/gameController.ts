/**
 * Game Controller — BubblePop (Pixi mode)
 *
 * Delegates to src/game/bubblepop/GameController.ts.
 * This file is the mygame-contract entry point required by GameScreen.tsx.
 *
 * Note: goto is not in GameControllerDeps (scaffold contract). We import it
 * from the screen system here and pass it via options to the bubblepop controller.
 */

import { BubblePopGameController } from '~/game/bubblepop/GameController';
import { useScreen } from '~/core/systems/screens';
import type { GameControllerDeps, GameController, SetupGame } from '~/game/mygame-contract';

export const setupGame: SetupGame = (deps: GameControllerDeps): GameController => {
  const { goto: screenGoto } = useScreen();
  return BubblePopGameController.create(deps, {
    goto: (screen: string) => { void screenGoto(screen as Parameters<typeof screenGoto>[0]); },
  });
};

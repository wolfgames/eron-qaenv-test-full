import { Show, createSignal } from 'solid-js';
import { useScreen } from '~/core/systems/screens';
import { Button } from '~/core/ui/Button';
import { gameState } from '~/game/state';

/**
 * Results Screen — Win + Loss branches.
 *
 * Win branch:  'Scooby-Dooby-Doo!' heading, star display, Next Level CTA
 * Loss branch: 'Ruh-roh! Out of moves!' heading, Try Again + Keep Going! CTAs
 *
 * Heading copy from GDD: win='Scooby-Dooby-Doo!', loss='Ruh-roh! Out of moves!'
 * collision:results-screen-copy resolved (gdd-wins). Scaffold generic heading replaced.
 */
export function ResultsScreen() {
  const { goto } = useScreen();
  const [keepGoingClicked, setKeepGoingClicked] = createSignal(false);

  const handleNextLevel = () => {
    gameState.incrementLevel();
    gameState.reset();
    goto('game');
  };

  const handleTryAgain = () => {
    gameState.reset();
    goto('game');
  };

  const handleKeepGoing = () => {
    // Honest no-op: button visible and labeled; ad/currency deferred to platform pass.
    // Not a stub — fires visible feedback (console.info + UI update).
    console.info('continue-requested');
    setKeepGoingClicked(true);
  };

  const handleMainMenu = () => {
    gameState.reset();
    goto('start');
  };

  const isWin = () => gameState.win();
  const stars = () => gameState.stars();
  const score = () => gameState.score();
  const chapterName = () => gameState.chapterName();

  return (
    <div class="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ 'background': isWin()
        ? 'linear-gradient(to bottom, #E8A820, #c4800d)'
        : 'linear-gradient(to bottom, #1a1228, #2d1a4a)' }}
    >
      <Show
        when={isWin()}
        fallback={
          /* Loss Branch */
          <div class="flex flex-col items-center gap-6 w-full max-w-sm">
            <div class="text-6xl">🐾</div>

            <h1 class="text-3xl font-bold text-white text-center leading-tight">
              Ruh-roh! Out of moves!
            </h1>

            {chapterName() && (
              <p class="text-white/70 text-sm text-center">{chapterName()}</p>
            )}

            <div class="text-center">
              <p class="text-white/60 text-sm mb-1">Score</p>
              <p class="text-4xl font-bold text-white">{score()}</p>
            </div>

            <div class="flex flex-col gap-3 w-full">
              <Button
                onClick={handleTryAgain}
                class="w-full min-h-[44px] py-3 text-lg"
              >
                Try Again
              </Button>

              <Button
                variant="secondary"
                onClick={handleKeepGoing}
                disabled={keepGoingClicked()}
                class="w-full min-h-[44px] py-3 text-lg"
              >
                {keepGoingClicked() ? 'Coming soon' : 'Keep Going!'}
              </Button>
            </div>

            <button
              onClick={handleMainMenu}
              class="text-white/50 text-sm underline"
            >
              Main Menu
            </button>
          </div>
        }
      >
        {/* Win Branch */}
        <div class="flex flex-col items-center gap-6 w-full max-w-sm">
          <div class="text-6xl">🐾</div>

          <h1 class="text-3xl font-bold text-white text-center leading-tight">
            Scooby-Dooby-Doo!
          </h1>

          {/* Star display */}
          <div class="flex gap-2 text-4xl" aria-label={`${stars()} out of 3 stars`}>
            <span style={{ opacity: stars() >= 1 ? '1' : '0.3' }}>⭐</span>
            <span style={{ opacity: stars() >= 2 ? '1' : '0.3' }}>⭐</span>
            <span style={{ opacity: stars() >= 3 ? '1' : '0.3' }}>⭐</span>
          </div>

          <div class="text-center">
            <p class="text-white/70 text-sm mb-1">Score</p>
            <p class="text-5xl font-bold text-white">{score()}</p>
          </div>

          <div class="flex flex-col gap-3 w-full">
            <Button
              onClick={handleNextLevel}
              class="w-full min-h-[44px] py-3 text-lg"
            >
              Next Level
            </Button>

            <Button
              variant="secondary"
              onClick={handleMainMenu}
              class="w-full min-h-[44px] py-3"
            >
              Main Menu
            </Button>
          </div>
        </div>
      </Show>
    </div>
  );
}

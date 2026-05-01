/**
 * Start Screen View — Scooby Snack Bubble Pop
 *
 * Title: 'Scooby Snack Bubble Pop' with Scooby-themed warm palette.
 * Play button: harvest orange bg, min-height 80px.
 * Unlocks audio on Play tap (mobile-constraints: audio unlock on first user tap).
 */

import type {
  StartScreenDeps,
  StartScreenController,
  SetupStartScreen,
} from '~/game/mygame-contract';

const SCOOBY_ORANGE = '#E8A820';
const PLAY_BUTTON_BG = '#c4800d';
const TEXT_COLOR = '#1a1228';

export const setupStartScreen: SetupStartScreen = (deps: StartScreenDeps): StartScreenController => {
  let wrapper: HTMLDivElement | null = null;

  return {
    backgroundColor: SCOOBY_ORANGE,

    init(container: HTMLDivElement) {
      console.log('[bubblepop] Start screen initialized');

      wrapper = document.createElement('div');
      wrapper.style.cssText =
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'height:100%;gap:32px;padding:24px;touch-action:none;user-select:none;';

      // Paw print decoration
      const paws = document.createElement('div');
      paws.textContent = '🐾 🐾 🐾';
      paws.style.cssText = 'font-size:2rem;letter-spacing:8px;opacity:0.6;';

      // Game title
      const title = document.createElement('h1');
      title.textContent = 'Scooby Snack Bubble Pop';
      title.style.cssText =
        `font-size:2rem;font-weight:900;color:${TEXT_COLOR};margin:0;` +
        `font-family:Baloo,system-ui,sans-serif;` +
        'text-align:center;text-shadow:0 2px 8px rgba(0,0,0,0.15);line-height:1.2;';

      // Subtitle
      const subtitle = document.createElement('p');
      subtitle.textContent = 'Pop the bubbles! Find every Scooby Snack!';
      subtitle.style.cssText =
        `font-size:1rem;color:${TEXT_COLOR};opacity:0.75;text-align:center;margin:0;` +
        `font-family:system-ui,sans-serif;`;

      // Play button — min-height 80px as required by visual theme spec
      const playBtn = document.createElement('button');
      playBtn.textContent = '🦴  Play!  🦴';
      playBtn.style.cssText =
        `font-size:1.5rem;font-weight:700;padding:0 48px;border:none;border-radius:16px;` +
        `background:${PLAY_BUTTON_BG};color:#fff;cursor:pointer;` +
        `font-family:Baloo,system-ui,sans-serif;` +
        `box-shadow:0 6px 20px rgba(0,0,0,0.25);` +
        `transition:transform 0.1s,box-shadow 0.1s;` +
        `min-height:80px;width:100%;max-width:280px;`;

      playBtn.onmouseenter = () => { playBtn.style.transform = 'scale(1.05)'; };
      playBtn.onmouseleave = () => { playBtn.style.transform = 'scale(1)'; };

      playBtn.addEventListener('click', async () => {
        playBtn.disabled = true;
        playBtn.textContent = 'Loading...';
        await deps.initGpu();
        deps.unlockAudio();
        await deps.loadCore();
        try { await deps.loadAudio(); } catch { /* audio optional */ }
        deps.analytics.trackGameStart({ start_source: 'play_button', is_returning_player: false });
        deps.goto('game');
      }, { once: true });

      wrapper.append(paws, title, subtitle, playBtn);
      container.append(wrapper);
    },

    destroy() {
      wrapper?.remove();
      wrapper = null;
      console.log('[bubblepop] Start screen destroyed');
    },
  };
};

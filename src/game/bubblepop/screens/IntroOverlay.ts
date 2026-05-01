/**
 * IntroOverlay — First-Time Intro Cutscene Controller.
 *
 * 4-panel comic-style narrative. Shown only on first session.
 * Session flag stored in localStorage key 'ssbp-intro-shown'.
 *
 * Panel content (real copy, not placeholder):
 *   Panel 1: Scooby and the gang discover the Mystery Machine has vanished!
 *   Panel 2: Shaggy finds a trail of Scooby Snacks leading into the manor!
 *   Panel 3: The snacks are hidden behind haunted bubbles!
 *   Panel 4: Pop the bubbles to find every Scooby Snack — and solve the mystery!
 *
 * Skip button: always visible, dismisses immediately.
 * Tapping anywhere advances to next panel.
 *
 * DOM-based overlay (SolidJS component or vanilla DOM) — no Pixi.
 * This is the controller; rendering is handled by DOM layer above canvas.
 */

export const INTRO_FLAG_KEY = 'ssbp-intro-shown';

export const INTRO_PANELS = [
  {
    id: 1,
    heading: 'Oh no, Scoob!',
    text: "Scooby and the gang discover the Mystery Machine has vanished — right before a big night at the old Creeping Manor!",
    emoji: '🚐',
  },
  {
    id: 2,
    heading: 'Zoinks!',
    text: "Shaggy finds a trail of Scooby Snacks leading into the creepy manor! 'L-l-like, someone wants us to follow!'",
    emoji: '🦴',
  },
  {
    id: 3,
    heading: 'Ruh-roh!',
    text: "The Scooby Snacks are hidden behind haunted bubbles! Pop the matching bubbles to reveal the snacks!",
    emoji: '👻',
  },
  {
    id: 4,
    heading: "Let's Go, Gang!",
    text: "Pop the bubbles to find every Scooby Snack — and solve the mystery of the Creeping Manor! Scooby-Dooby-Doo!",
    emoji: '🐾',
  },
] as const;

export interface IntroOverlayOptions {
  onComplete: () => void;
}

export class IntroOverlayController {
  private _onComplete: () => void;
  private _currentPanel: number = 0;

  constructor(opts: IntroOverlayOptions) {
    this._onComplete = opts.onComplete;
  }

  /**
   * Whether the intro should be shown (false if already seen).
   */
  shouldShow(): boolean {
    try {
      return localStorage.getItem(INTRO_FLAG_KEY) !== 'true';
    } catch {
      // localStorage not available
      return false;
    }
  }

  /**
   * Advance to the next panel.
   * If on the last panel, completes the intro.
   */
  advance(): void {
    this._currentPanel++;
    if (this._currentPanel >= INTRO_PANELS.length) {
      this._complete();
    }
  }

  /**
   * Skip the intro immediately.
   */
  skip(): void {
    this._complete();
  }

  get currentPanel(): number {
    return this._currentPanel;
  }

  get panels(): typeof INTRO_PANELS {
    return INTRO_PANELS;
  }

  private _complete(): void {
    try {
      localStorage.setItem(INTRO_FLAG_KEY, 'true');
    } catch {
      // localStorage not available — OK
    }
    this._onComplete();
  }
}

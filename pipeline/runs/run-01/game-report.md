---
type: game-report
game: Scooby Snack Bubble Pop
pipeline_version: "0.3.8"
run: 1
pass: core
status: partial
features:
  total: 17
  implemented: 14
  partial: 0
  deferred: 3
tests:
  new: 72
  passing: 193
  total: 213
issues:
  critical: 0
  minor: 3
cos:
  - id: core-interaction
    status: pass
    note: "Single-tap gesture, interaction-archetype.md present, visible shake feedback on lone-single, input blocked during animating phase, tap queue drains on idle return"
  - id: canvas
    status: pass
    note: "53px cells (>48px min), board y-offset=80px, HUD 0-80px no overlap, emoji+tint per flavor (distinguishable at a glance), Scooby-themed color palette on screens"
  - id: animated-dynamics
    status: pass
    note: "Event-queue playback (pop→gravity→snack→win/lose), stable entityId keying in all renderers, syncBoard board-diff (only moved sprites animate), GSAP power1.out gravity, squash/bounce scales with fall distance; cascade escalation not applicable to tap-to-clear game design (no auto-chains)"
  - id: scoring
    status: partial
    note: "Multiplicative formula present (popScore × cascadeMultiplier × moveEfficiency). Real-time score display in HUD FIXED this phase. Cascade depth tracking always 0 in GameController (no auto-chain loop) — cascadeMultiplier function implemented but cascadeDepth never advances beyond 0 in a single player turn."
completeness:
  items_required: 18
  items_met: 15
  items_gaps: 3
blocking:
  cos_failed: []
  completeness_gaps:
    - "scoring: cascade depth never advances in GameController (cascadeMultiplier always x1) — GameController handleValidTap does not loop back to detect new matches after gravity settle"
    - "core-mechanics: new-piece spawning from top not applicable (finite-board game design — GDD does not specify top-refill)"
    - "orphan-wiring: levelGenerator/reshuffleLogic/IntroOverlay wiring deferred — each requires new logic >50 LOC or cross-screen DOM integration exceeding wiring ceiling"
---

# Pipeline Report: Scooby Snack Bubble Pop

## Blocking issues — must resolve before next pass

- **Completeness gap (scoring)**: Cascade depth tracking not wired in `GameController.handleValidTap()`. The `computeCascadeMultiplier` function exists and is tested, but `cascadeDepth` is always 0 in actual gameplay because the GameController does not detect new groups forming after gravity settle. Secondary pass should wire a cascade-detection loop after gravity.
- **Completeness gap (orphan-wiring)**: `levelGenerator.ts`, `reshuffleLogic.ts`, and `IntroOverlay.ts` are implemented but not wired into the game loop. Each requires new integration logic exceeding the core-pass wiring ceiling (50 LOC, one file). Secondary pass must wire these.

> Note: Both gaps have build+tests green. `pipeline_status: partial` per mergeStatus() — worst-status wins.

## Features

- [x] pixi-game-controller — Pixi Application with 4-layer stage, ECS wired, boardPhase gating
- [x] feature-ecs-plugin — BubblePopPlugin with resources/archetypes/transactions/actions
- [x] feature-board-state — boardLogic, groupFinder, gravityFill (pure functions)
- [x] feature-board-renderer — BoardRenderer + BubbleRenderer with entityId-keyed diff
- [x] feature-hud-renderer — HudRenderer with moves, snacks, chapter name, score (fixed this phase)
- [x] feature-tap-interaction — TapHandler with queue, shake feedback on invalid tap
- [x] feature-gravity-fill — applyGravity with per-column fall, distance-scaled bounce
- [x] feature-scooby-snack-tile — SnackRenderer with dim preview, sparkle collect animation
- [x] feature-win-lose-conditions — WinLoseDetector, celebratory cascade, sad/happy portrait
- [x] feature-scoring — computePopScore/cascadeMultiplier/moveEfficiency/levelScore (formula complete)
- [x] feature-visual-theme — Scooby-themed screens, emoji bubble flavors, warm color palette
- [x] feature-scooby-portrait — ScoobyPortraitRenderer with excited/happy-spin/sad expressions
- [x] screen-results — Win branch (Scooby-Dooby-Doo! + stars + Next Level) + Loss branch (Ruh-roh! + Try Again + Keep Going!)
- [x] feature-continue-system — Keep Going! button with honest no-op (console.info + "Coming soon")
- [ ] feature-level-generation — levelGenerator.ts + solvabilityChecker.ts implemented but NOT wired in GameController (levels 6+ use hand-crafted data cyclically)
- [ ] feature-stuck-reshuffle — reshuffleLogic.ts implemented but NOT wired in GameController (stuck state not detected post-gravity)
- [ ] screen-intro-cutscene — IntroOverlay.ts implemented but NOT wired (DOM overlay mount deferred)

## CoS Compliance — pass `core`

| CoS | Status | Evidence / note |
|---|---|---|
| `core-interaction` | pass | Single-tap gesture; interaction-archetype.md present at `src/game/bubblepop/interaction-archetype.md`; shake feedback on lone bubble; input blocked via `isAnimating` flag; tap queue drains on idle |
| `canvas` | pass | 53px cells (≥48px min); board y=80px, no HUD overlap; emoji+color tint per flavor (5 distinct: 🦴🍕🍔🌭🥪); Scooby warm mustard/orange palette on screens |
| `animated-dynamics` | pass | Event-queue playback; entityId-keyed diff in syncBoard(); only moved cells animate; GSAP power1.out gravity (accelerating not constant); squash/bounce magnitude scales with fall distance (0.55–0.75 squash, 1.1–1.25 bounce) |
| `scoring` (base) | partial | Formula has ≥2 multiplicative dimensions (popScore × cascadeMultiplier × moveEfficiency); skilled score ≥3× beginner (tested); real-time HUD score display FIXED this phase; cascade depth always 0 in GameController — cascadeMultiplier never applied above x1 in practice |

## Completeness — pass `core`

| Area | Required | Met | Gaps |
|---|---|---|---|
| Interaction | 5 | 5 | 0 |
| Board & Pieces | 4 | 4 | 0 |
| Core Mechanics | 6 | 5 | 1 (cascade depth tracking) |
| Scoring (base) | 3 | 2 | 1 (cascade multiplier not applied in gameplay) |
| CoS mandatory checklist | 4 | 4 | 0 |

## Known Issues

- **Minor**: `computeCascadeMultiplier` exists but cascadeDepth is never advanced — scoring multiplier always x1 in actual gameplay. Formula is multiplicative in tests but not in the runtime game loop.
- **Minor**: `levelGenerator.ts` and `reshuffleLogic.ts` are fully implemented and tested (64 tests passing) but not wired into `GameController`. Levels 6+ use hand-crafted data cyclically instead of generating procedurally.
- **Minor**: `IntroOverlay.ts` (first-session cutscene) is implemented but the DOM overlay mount point above the Pixi canvas is not wired.

## Deferred

- **feature-level-generation** (levels 6+ procedural): Wiring requires level-number conditional branch in `GameController.init()` and solvability check loop. Exceeds core-pass wiring ceiling (>50 LOC, multi-file). Secondary pass.
- **feature-stuck-reshuffle**: Wiring requires post-gravity `detectStuck()` check + `reshuffleBoard` dispatch in `handleValidTap()`. Exceeds core-pass wiring ceiling. Secondary pass.
- **screen-intro-cutscene (IntroOverlay)**: DOM overlay above canvas requires SolidJS show/hide signal in `GameScreen.tsx` + mount point above canvas z-order. Cross-screen integration; exceeds ceiling. Secondary pass.
- **audio-feedback**: No sounds on pop/land/win/loss (platform pass dependency).
- **cascade depth tracking**: Wiring requires GameController to loop back post-gravity and check for new groups, incrementing depth counter. Belongs in secondary pass alongside cascade escalation.

## Recommendations

1. **Secondary pass priority 1**: Wire `reshuffleLogic.ts` into `handleValidTap()` post-gravity `detectStuck()` check — this is the core "Stuck!" safety net the GDD describes as critical.
2. **Secondary pass priority 2**: Wire `levelGenerator.ts` into `GameController.init()` for levels 6+ to enable procedural content.
3. **Secondary pass priority 3**: Wire cascade depth tracking into `handleValidTap()` — detect new groups after gravity, increment depth counter, apply `computeCascadeMultiplier`, increase visual intensity.
4. **Secondary pass priority 4**: Wire `IntroOverlay.ts` above canvas in `GameScreen.tsx`.
5. **Art pass**: Replace emoji fallbacks with sprite atlas once assets are provided. Emoji fallbacks are player-readable and brand-adjacent per plan resolution `q-asset-atlas=emoji-fallback`.

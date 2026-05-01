# BubblePop Interaction Archetype

**Game:** Scooby Snack Bubble Pop

## Interaction Type

**Tap** — single press to pop a connected group of same-flavor bubbles.

## Pointer Sequence

```
pointerdown  → Record tap position and start cell
                Show immediate selection highlight on touched bubble (<100ms)

pointertap   → (on board container)
                Resolve cell from pointer local coords
                Call findConnectedGroup(board, {row, col})
                If group.size >= 2:
                  Set boardPhase = 'animating' (blocks further input)
                  Dispatch executeTap({row, col, rng})
                If group.size == 1:
                  Fire invalid feedback: GSAP shake (200ms horizontal oscillation)
                  boardPhase remains 'idle'

(input blocked while boardPhase != 'idle')
```

## Direction Detection

N/A — Tap does not involve drag or direction. Point of contact resolves to a grid cell via:

```
col = Math.floor((localX - boardPadding) / cellPx)
row = Math.floor((localY) / cellPx)
```

## Cancel Behavior

Tap does not have a cancel concept — it either resolves to valid group (pop) or invalid (lone bubble). No mid-gesture cancel is possible.

## Invalid Gesture Feedback

When the player taps a lone single bubble (group size 1):
- **Visual:** GSAP horizontal oscillation on the tapped cell sprite — 4 oscillations of ±6px, 200ms total, `elastic.out` ease.
- **Audio:** thud/bounce sound fires (audio layer, not blocked in GPU).
- **State:** No change. boardPhase remains `idle`. Board is NOT locked.
- **Never silent.** Every lone tap gets visible feedback.

## Input Blocking

Input is blocked when `boardPhase` is any of: `animating`, `won`, `lost`, `reshuffling`.

Queued taps: if a tap arrives during `animating`, it is stored and replayed once `boardPhase` returns to `idle`.

## Feel Description

**Decisive and satisfying.** The bubble group confirms the tap instantly with a selection flash, then pops with a crisp burst. The player controls the pace — they tap, it responds immediately. No drag, no threshold, no ambiguity.

- **Response time:** selection highlight fires on `pointerdown` (< 100ms perceived)
- **Pop animation:** 180ms burst (scale 0 → 1.3 → 0, alpha → 0)
- **Gravity:** smooth fall with squash-bounce landing
- **Invalid tap:** bouncy shake, never silent

## Tap Target

Entire 53px × 53px cell container is the tap target. No dead zones between cells (3px gap is navigable by finger). `eventMode = 'static'` on each cell Container.

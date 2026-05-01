# Scooby Snack Bubble Pop
**Tagline:** Some mysteries are sweeter when you pop them open.
**Genre:** Casual / Match-3 Bubble Pop
**Platform:** Mobile first (portrait, touch), playable on web
**Target Audience:** Casual adults 30+

---

## Table of Contents

**The Game**
1. [Game Overview](#game-overview)
2. [At a Glance](#at-a-glance)

**How It Plays**
3. [Core Mechanics](#core-mechanics)
4. [Level Generation](#level-generation)

**How It Flows**
5. [Game Flow](#game-flow)

---

## Game Overview

Scooby Snack Bubble Pop is a casual bubble-popping match game set in the groovy, fog-drenched world of Mystery Inc. Players tap clusters of floating treat bubbles to clear the board and uncover hidden Scooby Snacks before their move count runs out. The game wraps classic pop-and-clear satisfaction in a hand-drawn, 1970s Saturday-morning-cartoon aesthetic — warm mustard yellows, harvest oranges, and avocado greens, with wobbly lettering and spooky-cute backdrops straight out of a haunted manor.

**Setting:** Iconic Mystery Inc. locations rendered in a warm, slightly creepy 70s cartoon style — haunted mansions, foggy graveyards, carnival funhouses, and spooky swamps. Each location features looping ambient details: flickering candles, bats flitting past, and Shaggy's silhouette sneaking across the background.

**Core Loop:** Player taps a group of matching treat bubbles → the cluster pops and falls away, revealing a Scooby Snack tile beneath → collecting all Snack tiles on the board completes the level and unlocks the next spooky scene.

---

## At a Glance

| | |
|---|---|
| **Grid** | 7×9 (portrait) |
| **Input** | Tap |
| **Bubble Colors / Flavors** | 5 (Bone, Pizza, Burger, Hot Dog, Sandwich) |
| **Min Group to Pop** | 2 bubbles |
| **Scooby Snack Tiles** | 3–8 per level |
| **Session Target** | 2–5 min per level |
| **Move Range** | 15–40 moves |
| **Failure** | Yes — out of moves |
| **Continue System** | Ad or in-game currency for extra moves |
| **Star Rating** | 1–3 stars, cosmetic only |

---

## Core Mechanics

### Primary Input

**Input type:** Single tap
**Acts on:** A bubble cell on the play grid
**Produces:** If the tapped bubble belongs to a group of 2 or more matching bubbles (same flavor), the entire connected group pops simultaneously and is cleared from the board. Bubbles above the cleared cells fall downward under gravity. If the tapped bubble is a lone single (no matching neighbor), the tap is invalid — no state change occurs (see Feedback & Juice for invalid tap feedback).

### Play Surface

- **Dimensions:** 7 columns × 9 rows (portrait orientation)
- **Visual cell size:** Minimum 44pt diameter per bubble; the entire cell is the tap target — no dead zones between cells
- **Scaling:** The grid scales to fill the available viewport between the HUD strip at the top (≈80pt) and the move counter bar at the bottom (≈60pt), maintaining square cells
- **Bounds:** Bubbles cannot exit grid bounds. Gravity is strictly downward (row 9 = bottom). Empty columns do not collapse horizontally — gaps remain in place
- **Cell types:** Bubble cell (occupied), Empty cell (cleared), Scooby Snack cell (locked beneath bubbles)

### Game Entities

#### Treat Bubble
- **Visual:** A round, slightly wobbly cartoon bubble with a glossy sheen. Each flavor has a distinct icon inside and a color-coded rim: Bone (cream/white), Pizza (red/orange), Burger (brown/yellow), Hot Dog (pink/tan), Sandwich (green/yellow)
- **Behavior:** Sits in a grid cell. Can be tapped. If connected to 2+ same-flavor neighbors (orthogonally adjacent), it is part of a poppable group. After its group is cleared, bubbles in rows above fall down to fill the gap
- **Edge cases:**
  - IF a bubble has no same-flavor orthogonal neighbors THEN it is a lone single and cannot be popped by tap
  - IF two groups of the same flavor are separated by a different flavor THEN they are treated as separate groups
  - IF a bubble falls into a cell that was adjacent to a Scooby Snack tile THEN it sits on top of the Snack tile normally

#### Scooby Snack Tile
- **Visual:** A large, golden bone-shaped cookie with "Scooby Snacks" embossed on it, locked in a cell. While bubbles sit above it, it is obscured (dim preview silhouette visible). When all bubbles directly above it in its column are cleared, the Snack tile is revealed with a sparkle pop animation
- **Behavior:** Occupies the bottom row of a column (or a designer-specified row). Cannot be tapped directly. Is collected automatically when it becomes the bottom-most exposed tile in its column AND the cell above it is cleared
- **Collection rule:** IF a Scooby Snack tile is exposed (no bubble occupies the cell directly above it in the same column, and the tile itself is in row 9 or has no bubbles above it blocking it) THEN it is auto-collected with a 400 ms collect animation
- **Edge cases:**
  - IF a Snack tile is in a non-bottom row, it is only collected when all bubbles in cells above it in that column have been cleared AND the Snack itself has nothing blocking it from rising to the exposed state
  - IF the last bubble above a Snack tile is popped as part of a group, the Snack collects immediately after the group-pop animation completes (no additional tap required)

#### Ghost Bubble (introduced level 6+)
- **Visual:** A translucent white bubble with a tiny cartoon ghost face inside — wiggly, cute, non-threatening
- **Behavior:** Occupies a grid cell like a normal bubble but has no flavor match. It cannot be part of a pop group. It can only be cleared when an adjacent group of 2+ bubbles is popped — the blast from the neighboring pop causes the Ghost Bubble to dissolve with a "Boo!" puff animation (300 ms)
- **Edge cases:**
  - IF a Ghost Bubble has no adjacent poppable group cleared THEN it is permanent until one is cleared nearby
  - IF multiple Ghost Bubbles are adjacent to the same cleared group THEN all dissolve simultaneously
  - Ghost Bubbles do not chain-pop each other — only a real flavor-group pop can dissolve them

### Movement & Physics Rules

1. IF a bubble group of 2 or more same-flavor bubbles is tapped THEN all bubbles in the connected group are removed from the grid simultaneously (instant removal, 180 ms pop particle burst plays on each cell)
2. IF any bubbles exist in rows above a cleared cell THEN those bubbles fall downward one cell at a time until each sits on top of another bubble or reaches the bottom of the grid (fall duration: 80 ms per row dropped, eased with `power1.out`)
3. IF multiple columns need to settle after a group pop THEN all columns fall simultaneously (not sequentially)
4. IF a Scooby Snack tile becomes exposed after gravity settles THEN a collect animation plays (400 ms sparkle rise) and the Snack counter in the HUD decrements
5. IF the board settles into a state where no group of 2+ same-flavor bubbles exists AND not all Snack tiles are collected THEN a "Stuck!" warning appears and the board reshuffles the top half of the grid (600 ms reshuffle animation) — this does not cost a move
6. IF a player taps during a fall/settle animation (Animating state) THEN the tap is queued and applied after the animation resolves — the board does not accept simultaneous input
7. IF input is received on a lone single bubble THEN the tap is rejected with no state change; invalid feedback fires (see Feedback & Juice)

> For invalid action feedback (visual, audio, duration), see [Feedback & Juice](#feedback--juice).

---

## Level Generation

### Method

**Hybrid** — Levels 1–5 are fully hand-crafted (tutorial and onboarding). Levels 6+ are procedurally generated using a seeded algorithm. All generated levels are validated for solvability before being stored.

### Generation Algorithm

**Step 1: Seed Initialization**
- Inputs: `levelNumber`, constant `SEED_SALT = 73829`
- Outputs: Deterministic RNG instance
- Constraints: `seed = levelNumber × SEED_SALT`. Same seed always produces identical output. RNG must be a seedable PRNG (e.g., mulberry32 or similar) — no `Math.random()`

**Step 2: Difficulty Parameterization**
- Inputs: `levelNumber`, difficulty table
- Outputs: `{gridFillPercent, flavorCount, moveLimit, snackCount, ghostCount}`
- Constraints:

| Level Range | Grid Fill | Flavors | Move Limit | Snacks | Ghosts |
|---|---|---|---|---|---|
| 6–15 | 80% | 3 | 35–40 | 3–4 | 0 |
| 16–30 | 85% | 4 | 28–35 | 4–5 | 0–1 |
| 31–50 | 90% | 4 | 22–30 | 5–6 | 1–2 |
| 51–80 | 92% | 5 | 18–25 | 6–7 | 2–3 |
| 81+ | 95% | 5 | 15–22 | 7–8 | 3–4 |

- Move limit is drawn from the range using the RNG; must always be a whole number

**Step 3: Scooby Snack Placement**
- Inputs: `snackCount`, grid dimensions (7 cols × 9 rows), RNG
- Outputs: Set of `{col, row}` positions for Snack tiles
- Constraints:
  - Snack tiles placed in rows 6–9 (lower two-thirds of grid)
  - No two Snack tiles in the same column unless `snackCount > 7`
  - Minimum 1 column separation between Snacks when possible
  - Snack positions are locked before bubble fill

**Step 4: Bubble Fill**
- Inputs: Grid, Snack positions, `gridFillPercent`, `flavorCount`, RNG
- Outputs: Full bubble layout
- Constraints:
  - Cells occupied by Snack tiles receive a bubble stack above them (Snack is never the top cell)
  - Flavors distributed with controlled randomness: each flavor must appear in at least 10% of filled cells; no single flavor may exceed 35% of filled cells
  - Ghost Bubbles placed after flavor fill, replacing up to `ghostCount` single-flavor isolated bubbles
  - Top 2 rows must never be entirely full (guarantees visual breathing room)

**Step 5: Solvability Check**
- Inputs: Full grid layout, `moveLimit`
- Outputs: Boolean `isValid` + `minimumMovesRequired`
- Constraints:
  - Simulate optimal play: greedily pop the largest available group each step; count moves until all Snacks collected or no moves remain
  - `isValid = (minimumMovesRequired <= moveLimit × 0.75)` — the level must be completable in at most 75% of the move budget via greedy strategy, leaving headroom for non-optimal casual play
  - IF `isValid == false` THEN reject and retry (Step 2 re-parameterizes with `seed + retryCount`)

### Seeding & Reproducibility

- Formula: `seed = levelNumber × 73829`
- The same `levelNumber` always produces the same level on any device
- Retry seeds: if attempt N fails validation, seed becomes `levelNumber × 73829 + N`
- Retry limit: 10 attempts before fallback

### Solvability Validation

**Rejection conditions:**
1. `minimumMovesRequired > moveLimit × 0.75` — too hard for casual play
2. Any Snack tile has zero possible paths to exposure (all columns above it are 100% Ghost Bubbles with no adjacent flavor groups)
3. Grid has fewer than 3 poppable groups at level start (player has nowhere meaningful to begin)

**Retry logic:** On rejection, increment retry counter, derive new seed (`seed + retryCount`), re-run from Step 2.

**Fallback chain:**
1. After 10 failed attempts, use the previous level's layout with `snackCount` reduced by 1 and `moveLimit` increased by 5
2. If the previous level layout is also unavailable, use a hardcoded safe template for that difficulty tier

**Last-resort guarantee:** Each difficulty tier has one hardcoded hand-authored "safe" layout (stored in `data/fallback-levels.json`) that is guaranteed solvable. This layout is used if all retries and the prior-level fallback fail.

### Hand-Crafted Levels

- **Which levels:** 1–5 (tutorial + onboarding)
- **Where data lives:** `data/hand-crafted-levels.json` — an array of level objects matching the procedural output schema
- **Who owns them:** Game design team; not modified by the procedural generator

---

## Game Flow

### Master Flow Diagram

```
[App Open]
    ↓ (BOOT — splash + asset load)
[Loading Screen]
    ↓ (assets ready)
[Title Screen]  ← lifecycle: TITLE
    ↓ (tap "Play")
[First-Time Intro Cutscene]  ← lifecycle: TITLE (first session only; skipped on return)
    ↓ (cutscene ends / tap to skip)
[Chapter Start Interstitial]  ← lifecycle: PROGRESSION
    ↓ (tap "Let's Go!")
[Gameplay Screen]  ← lifecycle: PLAY
    ↓ (all Snacks collected → WIN)
[Level Complete Screen]  ← lifecycle: OUTCOME
    ↓ (tap "Next Level")
[Gameplay Screen — next level]  ← lifecycle: PLAY
    ↓ (all levels in chapter complete)
[Chapter Complete Screen]  ← lifecycle: OUTCOME → PROGRESSION
    ↓ (tap "Continue")
[Chapter Start Interstitial — next chapter]  ← lifecycle: PROGRESSION
    ↓ ...

[Gameplay Screen]
    ↓ (moves run out, Snacks remain → LOSE)
[Loss Screen]  ← lifecycle: OUTCOME
    ↓ (tap "Try Again") → [Gameplay Screen — same level]
    ↓ (tap "Watch Ad" / spend currency) → [+5 moves, return to Gameplay Screen]
```

### Screen Breakdown

#### Loading Screen
- **lifecycle_phase:** BOOT
- **Purpose:** Load assets, initialize game systems
- **Player sees:** Full-screen Scooby-Doo themed splash — Mystery Machine silhouette rolling through a foggy night, retro halftone texture, animated "loading" paw prints marching across the bottom
- **Player does:** Nothing (passive wait); tap anywhere to skip if assets already cached
- **Session length:** 1–3 seconds (target)
- **Next:** Title Screen (automatic when assets ready)

#### Title Screen
- **lifecycle_phase:** TITLE
- **Purpose:** Greet returning players, orient first-timers
- **Player sees:** Game logo ("Scooby Snack Bubble Pop" in wobbly 70s lettering), animated background (haunted mansion, bats, flickering lantern), "Play" button (large, center), settings gear (top-right), sound toggle (top-left)
- **Player does:** Tap "Play" to start; tap settings; tap sound toggle
- **Session length:** ≤10 seconds (player-initiated)
- **Next:** First-Time Intro Cutscene (first session) OR Chapter Start Interstitial (returning)

#### First-Time Intro Cutscene
- **lifecycle_phase:** TITLE
- **Purpose:** Establish stakes and charm — why is Mystery Inc. popping bubbles?
- **Player sees:** 4–6 panel comic-style cutscene. Scooby and Shaggy discover a haunted kitchen where Scooby Snacks have been sealed inside magical bubbles by a mischievous ghost. Shaggy: "Like, we gotta pop 'em all, Scoob!" Scooby: "Scooby-Dooby-Doo!"
- **Player does:** Tap to advance panels; "Skip" button (top-right) available at all times
- **Session length:** 15–30 seconds or instant skip
- **Next:** Chapter Start Interstitial

#### Chapter Start Interstitial
- **lifecycle_phase:** PROGRESSION
- **Purpose:** Frame the next chapter's location, build anticipation
- **Player sees:** Full-screen art of the chapter's haunted location (e.g., "The Creeping Manor" for Chapter 1), chapter title in retro lettering, short flavor text (one sentence), "Let's Go!" CTA button
- **Player does:** Tap "Let's Go!" to begin
- **Session length:** 3–5 seconds (player-initiated)
- **Next:** Gameplay Screen (Level 1 of chapter)

#### Gameplay Screen
- **lifecycle_phase:** PLAY
- **Purpose:** Core play experience
- **Player sees:**
  - HUD strip (top): Chapter name (left), Scooby Snack counter "🦴 X remaining" (center), Move counter (right)
  - 7×9 bubble grid (center, occupies ~75% of viewport height)
  - Scooby portrait (bottom-left, small, reacts to pops with expressions)
  - Move counter bar (bottom-right, large legible number)
- **Player does:** Tap bubble groups to pop them; game auto-collects Snacks; watches Scooby react
- **Board states:** See Board States table below
- **Session length:** 2–5 minutes per level
- **Next:** Level Complete Screen (win) OR Loss Screen (lose)

#### Level Complete Screen
- **lifecycle_phase:** OUTCOME
- **Purpose:** Celebrate the win, show star rating, advance
- **Player sees:** Scooby doing a happy spin, "Scooby-Dooby-Doo!" voice line, star rating (1–3 stars based on remaining moves), "Next Level" button, optional share button
- **Player does:** Tap "Next Level"
- **Session length:** 5–8 seconds
- **Next:** Gameplay Screen (next level) OR Chapter Complete Screen (if chapter finished)

#### Loss Screen
- **lifecycle_phase:** OUTCOME
- **Purpose:** Gently acknowledge the fail, offer recovery
- **Player sees:** Scooby with a sad-but-cute face, "Ruh-roh! Out of moves!" text (never "Game Over"), remaining Snack count shown, two options: "Try Again" (restart level, free) and "Keep Going!" (watch ad or spend currency for +5 moves and resume mid-level)
- **Player does:** Choose Try Again or Keep Going
- **Session length:** 5–10 seconds
- **Next:** Gameplay Screen same level (either option)

#### Chapter Complete Screen
- **lifecycle_phase:** OUTCOME → PROGRESSION
- **Purpose:** Reward completing the chapter, tease what's next
- **Player sees:** Full-screen celebration — all five Mystery Inc. characters cheering (still art, cartoon style), chapter completion badge unlocked, teaser thumbnail of next chapter location, "Continue" button
- **Player does:** Tap "Continue"
- **Session length:** 5–10 seconds
- **Next:** Chapter Start Interstitial (next chapter)

### Board States

| State | Input Accepted? | Description |
|---|---|---|
| **Idle** | Yes | Board is settled; no animation playing; player can tap |
| **Animating** | No (queued) | Group pop, gravity fall, or Snack collect animation in progress; taps queued, not dropped |
| **Won** | No | All Snack tiles collected; win sequence fires automatically |
| **Lost** | No | Move counter reached 0 with Snacks remaining; loss sequence fires automatically |
| **Paused** | No | Player opened pause overlay; board frozen |
| **Reshuffling** | No | Stuck-state reshuffle animation playing (600 ms); no tap accepted |

Any transition that mutates visible pieces (group pop, gravity fill, reshuffle) is an animated transition — no instant state changes. All animated transitions use GSAP and complete before the board returns to Idle.

### Win Condition

`IF (scoobySnacksRemaining == 0) THEN board enters Won state`

### Lose Condition

`IF (movesRemaining == 0) AND (scoobySnacksRemaining > 0) THEN board enters Lost state`

### Win Sequence (ordered)

1. Final Snack collect animation plays (400 ms sparkle rise, Snack flies to counter)
2. Snack counter hits 0; board freezes (no further input)
3. All remaining bubbles on the board pop in a celebratory cascade — left to right, top to bottom, 30 ms stagger per cell
4. Scooby happy-spin animation plays (500 ms) in his portrait corner
5. "Scooby-Dooby-Doo!" audio clip plays
6. Stars calculated: 3 stars = >50% moves remaining; 2 stars = 20–50% remaining; 1 star = <20% remaining
7. Level Complete Screen slides in from bottom (300 ms ease-out)

### Loss Sequence (ordered)

1. Move counter reaches 0 after a pop resolves (board settles fully before loss is checked)
2. Board freezes; remaining Snack tiles pulse with a soft red glow (300 ms loop, 2 cycles)
3. Scooby sad-face animation plays in portrait (400 ms)
4. "Ruh-roh!" audio clip plays
5. Loss Screen fades in over board (400 ms crossfade) — board still dimly visible beneath overlay for context

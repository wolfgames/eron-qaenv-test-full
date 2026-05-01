/**
 * BubbleRenderer — renders a single bubble cell as a colored circle + emoji label.
 *
 * Flavor → tint and emoji mapping:
 *   bone     → cream   (#F5F0E8) + 🦴
 *   pizza    → red-orange (#E8442A) + 🍕
 *   burger   → brown   (#8B4513) + 🍔
 *   hotdog   → pink    (#E88080) + 🌭
 *   sandwich → yellow-green (#A0C040) + 🥪
 *
 * Designed to be pooled by entityId. Acquire via acquireBubble(), release via releaseBubble().
 */

import { Container, Graphics, Text } from 'pixi.js';
import type { Flavor } from '../state/types';

export interface FlavorStyle {
  color: number;
  emoji: string;
}

export const FLAVOR_STYLES: Record<Flavor, FlavorStyle> = {
  bone:     { color: 0xF5F0E8, emoji: '🦴' },
  pizza:    { color: 0xE8442A, emoji: '🍕' },
  burger:   { color: 0x8B4513, emoji: '🍔' },
  hotdog:   { color: 0xE88080, emoji: '🌭' },
  sandwich: { color: 0xA0C040, emoji: '🥪' },
};

export interface BubbleSprite {
  container: Container;
  entityId: string;
  flavor: Flavor;
  row: number;
  col: number;
}

export function createBubbleSprite(entityId: string, flavor: Flavor, cellPx: number): BubbleSprite {
  const style = FLAVOR_STYLES[flavor];
  const container = new Container();

  // Colored circle background
  const circle = new Graphics();
  const radius = (cellPx * 0.45);
  circle.circle(cellPx / 2, cellPx / 2, radius);
  circle.fill({ color: style.color });

  // Emoji label centered
  const emojiSize = Math.floor(cellPx * 0.55);
  const label = new Text(style.emoji, { fontSize: emojiSize });
  label.anchor.set(0.5, 0.5);
  label.x = cellPx / 2;
  label.y = cellPx / 2;

  container.addChild(circle);
  container.addChild(label);

  return { container, entityId, flavor, row: 0, col: 0 };
}

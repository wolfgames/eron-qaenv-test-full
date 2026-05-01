/**
 * BubblePop shared types
 */

export type Flavor = 'bone' | 'pizza' | 'burger' | 'hotdog' | 'sandwich';

export type BoardPhase = 'idle' | 'animating' | 'won' | 'lost' | 'reshuffling';

export interface CellPosition {
  row: number;
  col: number;
}

export interface BubbleCell {
  row: number;
  col: number;
  flavor: Flavor;
  entityId: string;
}

export interface SnackCell {
  row: number;
  col: number;
  covered: boolean;
  entityId: string;
}

export interface BoardState {
  cols: number;
  rows: number;
  cells: Array<BubbleCell | null>; // flat array [row*cols+col]
  snacks: SnackCell[];
}

export interface GravityDiff {
  entityId: string;
  fromRow: number;
  toRow: number;
  col: number;
  distance: number;
}

export interface AnimationEvent {
  type: 'pop' | 'gravity-drop' | 'snack-collect' | 'settle' | 'turn-complete';
  cells?: CellPosition[];
  diffs?: GravityDiff[];
  snackPos?: CellPosition;
  popScore?: number;
}

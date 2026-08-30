import type { NeuralVirtualRange } from '@neural-ng/core';

export type NeuralVirtualScrollerOrientation = 'vertical' | 'horizontal';
export type NeuralVirtualScrollerScrollBehavior = 'auto' | 'smooth';

export interface NeuralVirtualScrollerRangeEvent extends NeuralVirtualRange {
  /** First item intersecting the viewport. */
  readonly visibleStart: number;
  /** End-exclusive index after the last item intersecting the viewport. */
  readonly visibleEnd: number;
}

export interface NeuralVirtualScrollerScrollEvent
  extends NeuralVirtualScrollerRangeEvent {
  readonly offset: number;
}

export interface NeuralVirtualScrollerClasses {
  readonly root?: string;
  readonly viewport?: string;
  readonly content?: string;
  readonly spacerBefore?: string;
  readonly items?: string;
  readonly item?: string;
  readonly spacerAfter?: string;
  readonly empty?: string;
  readonly loading?: string;
}

export type NeuralVirtualScrollerTrackBy<T> = (
  item: T,
  index: number,
) => unknown;

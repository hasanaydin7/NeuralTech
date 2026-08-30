import type { NeuralOverlayPlacement } from '@neural-ng/core/overlay';

export type NeuralTooltipPosition = NeuralOverlayPlacement;

export interface NeuralTooltipClasses {
  readonly root?: string;
  readonly content?: string;
  readonly arrow?: string;
}

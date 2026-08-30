export type NeuralOverlayPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'right';

export interface NeuralOverlayPositionOptions {
  readonly placement?: NeuralOverlayPlacement;
  readonly offset?: number;
  readonly viewportPadding?: number;
}

export interface NeuralOverlayPositionRef {
  readonly resolvedPlacement: () => NeuralOverlayPlacement;
  update(): void;
  destroy(): void;
}

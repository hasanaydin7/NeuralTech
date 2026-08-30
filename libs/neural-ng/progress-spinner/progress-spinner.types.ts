export type NeuralProgressSpinnerSize = 'small' | 'medium' | 'large';
export type NeuralProgressSpinnerVariant = 'solid' | 'multicolor';
export type NeuralProgressSpinnerSeverity =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export interface NeuralProgressSpinnerClasses {
  readonly root?: string;
  readonly svg?: string;
  readonly track?: string;
  readonly indicator?: string;
  readonly inner?: string;
  readonly innerTrack?: string;
  readonly innerIndicator?: string;
  readonly label?: string;
}

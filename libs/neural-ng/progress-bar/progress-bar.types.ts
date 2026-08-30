export type NeuralProgressBarMode = 'determinate' | 'indeterminate';
export type NeuralProgressBarSize = 'small' | 'medium' | 'large';
export type NeuralProgressBarSeverity =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export interface NeuralProgressBarClasses {
  readonly root?: string;
  readonly track?: string;
  readonly buffer?: string;
  readonly value?: string;
  readonly label?: string;
}

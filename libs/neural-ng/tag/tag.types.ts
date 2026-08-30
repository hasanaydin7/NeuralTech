export type NeuralTagSeverity =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export type NeuralTagSize = 'small' | 'medium' | 'large';

export interface NeuralTagRemove {
  readonly value: string | null;
  readonly originalEvent: MouseEvent;
}

export interface NeuralTagClasses {
  readonly root?: string;
  readonly icon?: string;
  readonly label?: string;
  readonly content?: string;
  readonly removeButton?: string;
  readonly removeIcon?: string;
}

export type NeuralBadgeSeverity =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export type NeuralBadgeSize = 'small' | 'medium' | 'large';
export type NeuralBadgeAriaLive = 'off' | 'polite' | 'assertive';
export type NeuralBadgePosition =
  | 'start'
  | 'end'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end';

export interface NeuralBadgeClasses {
  readonly root?: string;
  readonly value?: string;
  readonly content?: string;
}

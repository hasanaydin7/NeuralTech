export type NeuralToastPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'middle-start'
  | 'middle-center'
  | 'middle-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

export interface NeuralToastConfig {
  readonly channel: string;
  readonly position: NeuralToastPosition;
  readonly ariaLabel: string;
  readonly closeLabel: string;
  readonly pauseOnInteraction: boolean;
  readonly showProgress: boolean;
  readonly swipeToDismiss: boolean;
  readonly swipeThreshold: number;
  readonly animated: boolean;
}

export type NeuralToastOptions = Partial<NeuralToastConfig>;

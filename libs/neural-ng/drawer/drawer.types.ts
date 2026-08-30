export type NeuralDrawerPosition = 'start' | 'end' | 'top' | 'bottom';

export type NeuralDrawerCloseReason =
  | 'api'
  | 'escape'
  | 'backdrop'
  | 'close-button'
  | 'native';

export interface NeuralDrawerClose {
  readonly reason: NeuralDrawerCloseReason;
  readonly returnValue: string;
  readonly nativeEvent?: Event;
}

export interface NeuralDrawerClasses {
  readonly root?: string;
  readonly header?: string;
  readonly body?: string;
  readonly footer?: string;
  readonly closeButton?: string;
  readonly closeIcon?: string;
}

export type NeuralDialogCloseReason =
  | 'api'
  | 'escape'
  | 'backdrop'
  | 'close-button'
  | 'native';

export interface NeuralDialogClose {
  readonly reason: NeuralDialogCloseReason;
  readonly returnValue: string;
  readonly nativeEvent?: Event;
}

export interface NeuralDialogClasses {
  readonly root?: string;
  readonly header?: string;
  readonly body?: string;
  readonly footer?: string;
  readonly closeButton?: string;
  readonly closeIcon?: string;
  readonly fullScreenButton?: string;
  readonly fullScreenIcon?: string;
}

export type NeuralToolbarOrientation = 'horizontal' | 'vertical';

export interface NeuralToolbarClasses {
  readonly root?: string;
  readonly start?: string;
  readonly center?: string;
  readonly end?: string;
  readonly separator?: string;
}

export interface NeuralToolbarFocusChange {
  readonly index: number;
  readonly element: HTMLElement;
  readonly nativeEvent: KeyboardEvent | FocusEvent;
}

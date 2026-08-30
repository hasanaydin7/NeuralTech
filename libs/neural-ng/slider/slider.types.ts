export type NeuralSliderOrientation = 'horizontal' | 'vertical';

export type NeuralSliderThumb = 'start' | 'end';

export type NeuralSliderRangeValue = [number, number];

export type NeuralSliderValue = number | NeuralSliderRangeValue;

export interface NeuralSliderEvent {
  value: NeuralSliderValue;
  originalEvent: Event;
  thumb?: NeuralSliderThumb;
}

export interface NeuralSliderClasses {
  root?: string;
  input?: string;
  value?: string;

  range?: string;
  track?: string;
  fill?: string;
}

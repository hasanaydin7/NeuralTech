export type NeuralRadioOrientation = 'horizontal' | 'vertical';
export type NeuralRadioInteractionSource = 'keyboard' | 'pointer';

export interface NeuralRadioSelectionChange<
  TValue = unknown,
  TOption = unknown,
> {
  readonly value: TValue;
  readonly previousValue: TValue | null;
  readonly option: TOption;
  readonly source: NeuralRadioInteractionSource;
}

export interface NeuralRadioClasses {
  readonly root?: string;
  readonly option?: string;
  readonly input?: string;
  readonly control?: string;
  readonly selectedControl?: string;
  readonly disabledOption?: string;
  readonly label?: string;
  readonly optionIcon?: string;
}

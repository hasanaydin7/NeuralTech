export type NeuralTriStateCheckboxValue = boolean | null;

export interface NeuralCheckboxChange {
  readonly checked: boolean;
  readonly previousChecked: boolean;
  readonly nativeEvent: Event;
}

export interface NeuralTriStateCheckboxChange {
  readonly value: NeuralTriStateCheckboxValue;
  readonly previousValue: NeuralTriStateCheckboxValue;
  readonly nativeEvent: Event;
}

export interface NeuralCheckboxClasses {
  readonly root?: string;
  readonly input?: string;
  readonly control?: string;
  readonly checkedControl?: string;
  readonly label?: string;
}

export type NeuralTriStateCheckboxClasses = NeuralCheckboxClasses & {
  readonly mixedControl?: string;
};

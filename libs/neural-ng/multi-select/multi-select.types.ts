export type NeuralMultiSelectDisplay = 'chip' | 'comma';
export type NeuralMultiSelectDataMode = 'local' | 'remote';
export type NeuralMultiSelectFilterMode =
  | 'contains'
  | 'startsWith'
  | 'endsWith';
export type NeuralMultiSelectInteractionSource = 'keyboard' | 'pointer' | 'api';

export interface NeuralResolvedMultiSelectOption<
  TValue = unknown,
  TOption = unknown,
> {
  readonly id: string;
  readonly label: string;
  readonly value: TValue;
  readonly disabled: boolean;
  readonly group: string;
  readonly source: TOption;
  readonly index: number;
}

export interface NeuralMultiSelectChange<TValue = unknown, TOption = unknown> {
  readonly value: readonly TValue[];
  readonly previousValue: readonly TValue[];
  readonly option: TOption | null;
  readonly source: NeuralMultiSelectInteractionSource;
}

export interface NeuralMultiSelectItemEvent<
  TValue = unknown,
  TOption = unknown,
> {
  readonly value: TValue;
  readonly values: readonly TValue[];
  readonly option: TOption;
  readonly source: NeuralMultiSelectInteractionSource;
}

export interface NeuralMultiSelectClearEvent<TValue = unknown> {
  readonly previousValue: readonly TValue[];
}

export interface NeuralMultiSelectFilterEvent {
  readonly query: string;
  readonly requestId: number;
}

export interface NeuralMultiSelectSelectAllEvent<TValue = unknown> {
  readonly checked: boolean;
  readonly value: readonly TValue[];
}

export interface NeuralMultiSelectClasses {
  readonly root?: string;
  readonly trigger?: string;
  readonly value?: string;
  readonly placeholder?: string;
  readonly chipList?: string;
  readonly chip?: string;
  readonly chipLabel?: string;
  readonly chipRemove?: string;
  readonly clearButton?: string;
  readonly dropdownButton?: string;
  readonly icon?: string;
  readonly panel?: string;
  readonly header?: string;
  readonly filter?: string;
  readonly selectAll?: string;
  readonly list?: string;
  readonly group?: string;
  readonly option?: string;
  readonly optionLabel?: string;
  readonly checkbox?: string;
  readonly activeOption?: string;
  readonly selectedOption?: string;
  readonly disabledOption?: string;
  readonly emptyMessage?: string;
  readonly loadingMessage?: string;
  readonly footer?: string;
}

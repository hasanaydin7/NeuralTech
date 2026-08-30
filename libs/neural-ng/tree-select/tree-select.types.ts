import type {
  NeuralTreeKey,
  NeuralTreeSelectionMode,
} from '@neural-ng/core/tree';

export type NeuralTreeSelectValue<TValue = unknown> =
  | TValue
  | readonly TValue[]
  | null;

export interface NeuralTreeSelectClasses {
  readonly root?: string;
  readonly trigger?: string;
  readonly value?: string;
  readonly placeholder?: string;
  readonly chipList?: string;
  readonly chip?: string;
  readonly chipRemove?: string;
  readonly clearButton?: string;
  readonly dropdownButton?: string;
  readonly panel?: string;
  readonly header?: string;
  readonly filter?: string;
  readonly tree?: string;
  readonly empty?: string;
  readonly loading?: string;
}

export interface NeuralTreeSelectChange<TValue = unknown, TOption = unknown> {
  readonly value: NeuralTreeSelectValue<TValue>;
  readonly previousValue: NeuralTreeSelectValue<TValue>;
  readonly option: TOption | null;
  readonly key: NeuralTreeKey | null;
  readonly selected: boolean;
  readonly mode: NeuralTreeSelectionMode;
  readonly source: 'keyboard' | 'pointer';
}

export interface NeuralTreeSelectClear<TValue = unknown> {
  readonly previousValue: NeuralTreeSelectValue<TValue>;
}

export interface NeuralTreeSelectFilterEvent {
  readonly value: string;
}

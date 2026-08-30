export type NeuralAutoCompleteDataMode = 'local' | 'remote';
export type NeuralAutoCompleteValueMode = 'option' | 'text';
export type NeuralAutoCompleteFilterMode =
  | 'contains'
  | 'startsWith'
  | 'endsWith';
export type NeuralAutoCompleteInteractionSource =
  | 'input'
  | 'keyboard'
  | 'pointer';
export type NeuralAutoCompleteSearchReason = 'input' | 'focus' | 'dropdown';

export interface NeuralAutoCompleteSearchEvent {
  readonly query: string;
  readonly requestId: number;
  readonly reason: NeuralAutoCompleteSearchReason;
}

export interface NeuralAutoCompleteSelectEvent<
  TValue = unknown,
  TOption = unknown,
> {
  readonly value: TValue | string | null;
  readonly previousValue: TValue | string | null;
  readonly option: TOption;
  readonly source: NeuralAutoCompleteInteractionSource;
}

export interface NeuralAutoCompleteClearEvent<TValue = unknown> {
  readonly previousValue: TValue | string | null;
  readonly previousQuery: string;
}

export interface NeuralAutoCompleteInvalidInputEvent {
  readonly query: string;
  readonly reason: 'force-selection';
}

export interface NeuralResolvedAutoCompleteOption<
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

export interface NeuralAutoCompleteClasses {
  readonly root?: string;
  readonly inputGroup?: string;
  readonly input?: string;
  readonly clearButton?: string;
  readonly dropdownButton?: string;
  readonly loadingIndicator?: string;
  readonly icon?: string;
  readonly panel?: string;
  readonly list?: string;
  readonly group?: string;
  readonly option?: string;
  readonly activeOption?: string;
  readonly selectedOption?: string;
  readonly disabledOption?: string;
  readonly emptyMessage?: string;
  readonly loadingMessage?: string;
}

import type { TemplateRef } from '@angular/core';

export type NeuralSelectInteractionSource = 'keyboard' | 'pointer';

export interface NeuralSelectChange<TValue = unknown, TOption = unknown> {
  readonly value: TValue | null;
  readonly previousValue: TValue | null;
  readonly option: TOption | null;
  readonly source: NeuralSelectInteractionSource;
}

export interface NeuralSelectClear<TValue = unknown> {
  readonly previousValue: TValue | null;
}

export interface NeuralSelectClasses {
  readonly root?: string;
  readonly trigger?: string;
  readonly value?: string;
  readonly placeholder?: string;
  readonly dropdownIcon?: string;
  readonly clearButton?: string;
  readonly panel?: string;
  readonly list?: string;
  readonly option?: string;
  readonly activeOption?: string;
  readonly selectedOption?: string;
  readonly disabledOption?: string;
  readonly optionIcon?: string;
  readonly emptyMessage?: string;
  readonly loadingMessage?: string;
}

export interface NeuralResolvedSelectOption<
  TValue = unknown,
  TOption = unknown,
> {
  readonly id: string;
  readonly label: string;
  readonly value: TValue;
  readonly disabled: boolean;
  readonly iconClass: string;
  readonly source: TOption;
  readonly template?: TemplateRef<unknown>;
}
export type NeuralSelectAppendTo = 'self' | 'body';

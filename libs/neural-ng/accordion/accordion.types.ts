export type NeuralAccordionValue = string | number;
export type NeuralAccordionModelValue =
  | NeuralAccordionValue
  | readonly NeuralAccordionValue[]
  | null;
export type NeuralAccordionInteractionSource = 'keyboard' | 'pointer';

export interface NeuralAccordionPanelChange {
  readonly panelValue: NeuralAccordionValue;
  readonly expanded: boolean;
  readonly value: NeuralAccordionModelValue;
  readonly previousValue: NeuralAccordionModelValue;
  readonly source: NeuralAccordionInteractionSource;
}

export interface NeuralAccordionClasses {
  readonly root?: string;
  readonly panel?: string;
  readonly expandedPanel?: string;
  readonly disabledPanel?: string;
  readonly header?: string;
  readonly trigger?: string;
  readonly label?: string;
  readonly icon?: string;
  readonly content?: string;
  readonly contentInner?: string;
}

export interface NeuralResolvedAccordionItem<TItem = unknown> {
  readonly value: NeuralAccordionValue;
  readonly label: string;
  readonly content: string;
  readonly disabled: boolean;
  readonly source: TItem;
}

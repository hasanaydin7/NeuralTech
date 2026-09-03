import { InjectionToken, type Signal } from '@angular/core';

export interface NeuralFieldClassSlots {
  readonly root?: string;
  readonly label?: string;
  readonly control?: string;
  readonly hint?: string;
  readonly error?: string;
}

export interface NeuralFieldContext {
  readonly controlId: Signal<string>;
  readonly controlDescribedBy: Signal<string | null>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly readonly: Signal<boolean>;
  readonly pending: Signal<boolean>;
  readonly fluid: Signal<boolean>;
  readonly effectiveUnstyled: Signal<boolean>;
  readonly classes?: Signal<NeuralFieldClassSlots>;
  hintId(slot: object): string;
  errorId(slot: object): string;
}

export const NEURAL_FIELD_CONTEXT = new InjectionToken<NeuralFieldContext>(
  'NEURAL_FIELD_CONTEXT',
);

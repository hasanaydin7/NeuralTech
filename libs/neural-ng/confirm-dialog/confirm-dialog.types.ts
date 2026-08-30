import type { Signal } from '@angular/core';

export type NeuralConfirmationResult = 'accepted' | 'rejected' | 'dismissed';
export type NeuralConfirmationCloseReason =
  | 'accept'
  | 'reject'
  | 'escape'
  | 'backdrop'
  | 'close-button'
  | 'api'
  | 'replaced';
export type NeuralConfirmationAction = () =>
  | boolean
  | void
  | Promise<boolean | void>;

export interface NeuralConfirmationInput {
  readonly key?: string;
  readonly header?: string;
  readonly message: string;
  readonly icon?: boolean;
  readonly iconClass?: string;
  readonly acceptLabel?: string;
  readonly rejectLabel?: string;
  readonly acceptIconClass?: string;
  readonly rejectIconClass?: string;
  readonly acceptVisible?: boolean;
  readonly rejectVisible?: boolean;
  readonly closable?: boolean;
  readonly closeOnEscape?: boolean;
  readonly dismissibleBackdrop?: boolean;
  readonly accept?: NeuralConfirmationAction;
  readonly reject?: NeuralConfirmationAction;
  readonly onClose?: (event: NeuralConfirmationClose) => void;
  readonly data?: unknown;
}

export interface NeuralConfirmation
  extends Omit<NeuralConfirmationInput, 'key' | 'message'> {
  readonly id: string;
  readonly key: string;
  readonly message: string;
}

export interface NeuralConfirmationClose {
  readonly confirmation: NeuralConfirmation;
  readonly result: NeuralConfirmationResult;
  readonly reason: NeuralConfirmationCloseReason;
}

export interface NeuralConfirmationRef {
  readonly id: string;
  readonly closed: Signal<boolean>;
  readonly result: Signal<NeuralConfirmationResult | null>;
  readonly closeReason: Signal<NeuralConfirmationCloseReason | null>;
  dismiss(): void;
}

export interface NeuralConfirmDialogClasses {
  readonly root?: string;
  readonly header?: string;
  readonly icon?: string;
  readonly title?: string;
  readonly body?: string;
  readonly message?: string;
  readonly footer?: string;
  readonly acceptButton?: string;
  readonly rejectButton?: string;
  readonly buttonIcon?: string;
}

export interface NeuralConfirmDialogActionError {
  readonly confirmation: NeuralConfirmation;
  readonly action: 'accept' | 'reject';
  readonly error: unknown;
}

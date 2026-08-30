import type { Signal } from '@angular/core';

export type NeuralMessageSeverity =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export type NeuralMessageDismissReason =
  | 'api'
  | 'clear'
  | 'overflow'
  | 'timeout'
  | 'user';

export interface NeuralMessageInput {
  readonly severity?: NeuralMessageSeverity;
  readonly title?: string;
  readonly message: string;
  readonly channel?: string;
  readonly duration?: number | null;
  readonly dismissible?: boolean;
  readonly data?: unknown;
}

export interface NeuralMessageRecord {
  readonly id: string;
  readonly severity: NeuralMessageSeverity;
  readonly title?: string;
  readonly message: string;
  readonly channel: string;
  readonly duration: number | null;
  readonly dismissible: boolean;
  readonly data?: unknown;
}

export interface NeuralMessageRef {
  readonly id: string;
  readonly closed: Signal<boolean>;
  readonly closeReason: Signal<NeuralMessageDismissReason | null>;
  dismiss(): void;
}

export interface NeuralMessagesConfig {
  readonly defaultChannel: string;
  readonly defaultDuration: number | null;
  readonly importantDuration: number | null;
  readonly maxVisible: number;
}

export type NeuralMessagesOptions = Partial<NeuralMessagesConfig>;

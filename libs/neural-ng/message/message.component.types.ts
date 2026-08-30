import type { NeuralMessageSeverity } from './message.types';

export type NeuralInlineMessageSeverity = NeuralMessageSeverity;
export type NeuralMessageVariant = 'filled' | 'outlined' | 'simple';
export type NeuralMessageSize = 'small' | 'medium' | 'large';
export type NeuralMessageAriaLive = 'auto' | 'off' | 'polite' | 'assertive';

export interface NeuralMessageClasses {
  readonly root?: string;
  readonly icon?: string;
  readonly content?: string;
  readonly title?: string;
  readonly detail?: string;
  readonly actions?: string;
  readonly close?: string;
}

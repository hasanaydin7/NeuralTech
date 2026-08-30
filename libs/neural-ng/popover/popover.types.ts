import type { NeuralOverlayPlacement } from '@neural-ng/core/overlay';

export type NeuralPopoverPosition = NeuralOverlayPlacement;
export type NeuralPopoverFocusOnOpen = 'none' | 'first';
export type NeuralPopoverRole = 'dialog' | 'region' | null;
export type NeuralPopoverCloseReason =
  | 'trigger'
  | 'outside'
  | 'escape'
  | 'close-directive'
  | 'api'
  | 'native';

export interface NeuralPopoverClasses {
  readonly root?: string;
  readonly content?: string;
  readonly arrow?: string;
}

export interface NeuralPopoverShowOptions {
  readonly position?: NeuralPopoverPosition;
  readonly offset?: number;
  readonly viewportPadding?: number;
  readonly focusOnOpen?: NeuralPopoverFocusOnOpen;
}

export interface NeuralPopoverOpenEvent {
  readonly trigger: HTMLElement;
  readonly position: NeuralPopoverPosition;
}

export interface NeuralPopoverCloseEvent {
  readonly reason: NeuralPopoverCloseReason;
  readonly trigger: HTMLElement | null;
  readonly originalEvent?: Event;
}

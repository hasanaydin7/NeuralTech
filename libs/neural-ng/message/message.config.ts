import { InjectionToken } from '@angular/core';
import type { NeuralMessagesConfig } from './message.types';

export const DEFAULT_NEURAL_MESSAGES_CONFIG: NeuralMessagesConfig = {
  defaultChannel: 'global',
  defaultDuration: 5000,
  importantDuration: null,
  maxVisible: 3,
};

export const NEURAL_MESSAGES_CONFIG =
  new InjectionToken<NeuralMessagesConfig>('NEURAL_MESSAGES_CONFIG');

export function validateDuration(
  duration: number | null,
  propertyName: string
): void {
  if (
    duration !== null &&
    (!Number.isFinite(duration) || duration <= 0)
  ) {
    throw new Error(
      `NeuralNg messages: ${propertyName} must be a positive number or null.`
    );
  }
}

import {
  type EnvironmentProviders,
  makeEnvironmentProviders,
} from '@angular/core';
import {
  DEFAULT_NEURAL_TOAST_CONFIG,
  NEURAL_TOAST_CONFIG,
} from './toast.config';
import type {
  NeuralToastConfig,
  NeuralToastOptions,
  NeuralToastPosition,
} from './toast.types';

const POSITIONS: readonly NeuralToastPosition[] = [
  'top-start',
  'top-center',
  'top-end',
  'middle-start',
  'middle-center',
  'middle-end',
  'bottom-start',
  'bottom-center',
  'bottom-end',
];

export function provideNeuralToast(
  options: NeuralToastOptions = {},
): EnvironmentProviders {
  const config = validateToastConfig({
    ...DEFAULT_NEURAL_TOAST_CONFIG,
    ...options,
  });

  return makeEnvironmentProviders([
    { provide: NEURAL_TOAST_CONFIG, useValue: config },
  ]);
}

export function normalizeToastPosition(value: string): NeuralToastPosition {
  if (!POSITIONS.includes(value as NeuralToastPosition)) {
    throw new Error(`NeuralNg toast: invalid position "${value}".`);
  }
  return value as NeuralToastPosition;
}

function validateToastConfig(config: NeuralToastConfig): NeuralToastConfig {
  const channel = config.channel.trim();

  if (!channel) {
    throw new Error('NeuralNg toast: channel cannot be empty.');
  }
  normalizeToastPosition(config.position);

  if (!config.ariaLabel.trim()) {
    throw new Error('NeuralNg toast: ariaLabel cannot be empty.');
  }
  if (!config.closeLabel.trim()) {
    throw new Error('NeuralNg toast: closeLabel cannot be empty.');
  }

  if (!Number.isFinite(config.swipeThreshold) || config.swipeThreshold <= 0) {
    throw new Error('NeuralNg toast: swipeThreshold must be positive.');
  }

  return Object.freeze({
    ...config,
    channel,
    ariaLabel: config.ariaLabel.trim(),
    closeLabel: config.closeLabel.trim(),
  });
}

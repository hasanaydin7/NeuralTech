import { InjectionToken } from '@angular/core';
import {
  type NeuralColorMode,
  type NeuralColorModeConfig,
} from './color-mode.types';

const COLOR_MODES: readonly NeuralColorMode[] = ['light', 'dark', 'system'];

export const DEFAULT_NEURAL_COLOR_MODE_CONFIG: NeuralColorModeConfig =
  Object.freeze({
    defaultMode: 'system',
    storageKey: 'neural-color-mode',
  });

export const NEURAL_COLOR_MODE_CONFIG =
  new InjectionToken<NeuralColorModeConfig>('NEURAL_COLOR_MODE_CONFIG', {
    factory: () => DEFAULT_NEURAL_COLOR_MODE_CONFIG,
  });

export function validateColorModeConfig(
  config: NeuralColorModeConfig,
): NeuralColorModeConfig {
  if (!COLOR_MODES.includes(config.defaultMode)) {
    throw new Error(
      `NeuralNg color mode defaultMode must be light, dark, or system; received "${String(config.defaultMode)}".`,
    );
  }

  if (config.storageKey !== null && config.storageKey.trim().length === 0) {
    throw new Error(
      'NeuralNg color mode storageKey must be a non-empty string or null.',
    );
  }

  return Object.freeze({ ...config });
}

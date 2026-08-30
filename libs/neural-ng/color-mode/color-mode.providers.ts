import {
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@angular/core';
import { NeuralColorModeService } from './color-mode.service';
import {
  DEFAULT_NEURAL_COLOR_MODE_CONFIG,
  NEURAL_COLOR_MODE_CONFIG,
  validateColorModeConfig,
} from './color-mode.config';
import { type NeuralColorModeOptions } from './color-mode.types';

export function provideNeuralColorMode(
  options: NeuralColorModeOptions = {},
): EnvironmentProviders {
  const config = validateColorModeConfig({
    ...DEFAULT_NEURAL_COLOR_MODE_CONFIG,
    ...options,
  });

  return makeEnvironmentProviders([
    { provide: NEURAL_COLOR_MODE_CONFIG, useValue: config },
    provideAppInitializer(() => inject(NeuralColorModeService).initialize()),
  ]);
}

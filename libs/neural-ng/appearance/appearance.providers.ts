import {
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@angular/core';
import { NEURAL_COLOR_MODE_CONFIG } from '@neural-ng/core/color-mode';
import {
  NEURAL_APPEARANCE_CONFIG,
  resolveNeuralAppearanceConfig,
} from './appearance.config';
import { NeuralAppearanceService } from './appearance.service';
import type { NeuralAppearanceOptions } from './appearance.types';

export function provideNeuralAppearance(
  options: NeuralAppearanceOptions = {},
): EnvironmentProviders {
  const config = resolveNeuralAppearanceConfig(options);
  return makeEnvironmentProviders([
    { provide: NEURAL_APPEARANCE_CONFIG, useValue: config },
    {
      provide: NEURAL_COLOR_MODE_CONFIG,
      useValue: Object.freeze({
        defaultMode: config.mode,
        storageKey:
          config.storageKey === null ? null : config.storageKey + '-mode',
      }),
    },
    provideAppInitializer(() => inject(NeuralAppearanceService).initialize()),
  ]);
}

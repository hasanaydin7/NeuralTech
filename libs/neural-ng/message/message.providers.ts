import {
  type EnvironmentProviders,
  makeEnvironmentProviders,
} from '@angular/core';
import {
  DEFAULT_NEURAL_MESSAGES_CONFIG,
  NEURAL_MESSAGES_CONFIG,
  validateDuration,
} from './message.config';
import { NeuralMessageService } from './message.service';
import type {
  NeuralMessagesConfig,
  NeuralMessagesOptions,
} from './message.types';

export function provideNeuralMessages(
  options: NeuralMessagesOptions = {}
): EnvironmentProviders {
  const config = validateConfig({
    ...DEFAULT_NEURAL_MESSAGES_CONFIG,
    ...options,
  });

  return makeEnvironmentProviders([
    {
      provide: NEURAL_MESSAGES_CONFIG,
      useValue: config,
    },
    NeuralMessageService,
  ]);
}

function validateConfig(config: NeuralMessagesConfig): NeuralMessagesConfig {
  const defaultChannel = config.defaultChannel.trim();

  if (!defaultChannel) {
    throw new Error('NeuralNg messages: defaultChannel cannot be empty.');
  }

  if (!Number.isInteger(config.maxVisible) || config.maxVisible < 1) {
    throw new Error(
      'NeuralNg messages: maxVisible must be a positive integer.'
    );
  }

  validateDuration(config.defaultDuration, 'defaultDuration');
  validateDuration(config.importantDuration, 'importantDuration');

  return Object.freeze({
    ...config,
    defaultChannel,
  });
}

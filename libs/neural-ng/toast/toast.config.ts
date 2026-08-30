import { InjectionToken } from '@angular/core';
import type { NeuralToastConfig } from './toast.types';

export const DEFAULT_NEURAL_TOAST_CONFIG: NeuralToastConfig = Object.freeze({
  channel: 'global',
  position: 'top-end',
  ariaLabel: 'Notifications',
  closeLabel: 'Close notification',
  pauseOnInteraction: true,
  showProgress: false,
  swipeToDismiss: true,
  swipeThreshold: 72,
  animated: true,
});

export const NEURAL_TOAST_CONFIG = new InjectionToken<NeuralToastConfig>(
  'NEURAL_TOAST_CONFIG',
  { factory: () => DEFAULT_NEURAL_TOAST_CONFIG },
);

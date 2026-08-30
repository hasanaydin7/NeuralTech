import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideNeuralMessages } from '@neural-ng/core/message';
import { provideNeuralToast } from '@neural-ng/core/toast';
import { provideNeuralColorMode } from '@neural-ng/core/color-mode';
import { provideNeuralNg } from '@neural-ng/core';
import { neuralEn } from '@neural-ng/core/locales/en';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
    provideNeuralColorMode({ defaultMode: 'system' }),
    provideNeuralNg({ locale: neuralEn }),
    provideNeuralMessages({ maxVisible: 3 }),
    provideNeuralToast({ showProgress: true, swipeThreshold: 80 }),
  ],
};

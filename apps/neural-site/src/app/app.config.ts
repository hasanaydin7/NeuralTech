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
import { provideNeuralNg } from '@neural-ng/core';
import { provideNeuralAppearance } from '@neural-ng/core/appearance';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideNeuralNg({ direction: 'ltr' }),
    provideNeuralAppearance({
      primary: 'blue',
      surface: 'slate',
      mode: 'dark',
      direction: 'ltr',
      storageKey: 'neural-site',
    }),
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
  ],
};

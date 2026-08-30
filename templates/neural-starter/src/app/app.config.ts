import { ApplicationConfig } from '@angular/core';
import { provideNeuralNg } from '@neural-ng/core';
import { provideNeuralColorMode } from '@neural-ng/core/color-mode';
import { provideNeuralMessages } from '@neural-ng/core/message';
import { provideNeuralToast } from '@neural-ng/core/toast';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNeuralNg(),
    provideNeuralColorMode({ defaultMode: 'system' }),
    provideNeuralMessages({ maxVisible: 3 }),
    provideNeuralToast({ showProgress: true }),
  ],
};

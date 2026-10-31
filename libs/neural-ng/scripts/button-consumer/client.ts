import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { ConsumerApp, createProviders } from './app';

bootstrapApplication(ConsumerApp, { providers: createProviders() })
  .then(async (app) => {
    await app.whenStable();
    document.documentElement.dataset['hydrated'] = 'true';
  })
  .catch((error) => console.error(error));

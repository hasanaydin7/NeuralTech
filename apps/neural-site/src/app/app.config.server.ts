import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { SITE_ORIGIN } from './core/site-seo.service';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: SITE_ORIGIN,
      useValue: process.env['NEURAL_SITE_ORIGIN']?.trim() ?? '',
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);

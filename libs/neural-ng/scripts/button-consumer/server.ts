import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideServerRendering,
  renderApplication,
} from '@angular/platform-server';
import { ConsumerApp, createProviders } from './app';

export function render(document: string) {
  return renderApplication(
    (context) =>
      bootstrapApplication(
        ConsumerApp,
        {
          providers: [provideServerRendering(), ...createProviders()],
        },
        context,
      ),
    { document, url: 'http://localhost/', allowedHosts: ['localhost'] },
  );
}

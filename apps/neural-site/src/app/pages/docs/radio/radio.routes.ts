import type { Routes } from '@angular/router';

export const RADIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./radio.page').then((module) => module.RadioPage),
    title: 'Radio — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Radio Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Radio API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Radio Tokens — NeuralNg', children: [] },
    ],
  },
];

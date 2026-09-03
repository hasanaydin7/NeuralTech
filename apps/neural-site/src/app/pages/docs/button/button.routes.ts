import type { Routes } from '@angular/router';

export const BUTTON_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./button.page').then((module) => module.ButtonPage),
    title: 'Button — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Button Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Button API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Button Tokens — NeuralNg', children: [] },
    ],
  },
];

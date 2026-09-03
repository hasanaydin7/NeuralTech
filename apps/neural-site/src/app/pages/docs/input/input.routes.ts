import type { Routes } from '@angular/router';

export const INPUT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./input.page').then((module) => module.InputPage),
    title: 'Input — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Input Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Input API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Input Tokens — NeuralNg', children: [] },
    ],
  },
];

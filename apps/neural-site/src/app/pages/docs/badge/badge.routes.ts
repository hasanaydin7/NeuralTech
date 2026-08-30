import type { Routes } from '@angular/router';

export const BADGE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./badge.page').then((module) => module.BadgePage),
    title: 'Badge — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Badge Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Badge API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Badge Tokens — NeuralNg', children: [] },
    ],
  },
];

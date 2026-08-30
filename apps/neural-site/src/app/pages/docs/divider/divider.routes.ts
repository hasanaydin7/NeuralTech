import { Routes } from '@angular/router';

export const DIVIDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./divider.page').then((module) => module.DividerPage),
    title: 'Divider — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Divider Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Divider API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Divider Tokens — NeuralNg', children: [] },
    ],
  },
];

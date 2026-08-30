import type { Routes } from '@angular/router';

export const AUTO_COMPLETE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./auto-complete.page').then((module) => module.AutoCompletePage),
    title: 'AutoComplete — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'AutoComplete Accessibility — NeuralNg',
        children: [],
      },
      {
        path: 'api',
        title: 'AutoComplete API — NeuralNg',
        children: [],
      },
      {
        path: 'tokens',
        title: 'AutoComplete Tokens — NeuralNg',
        children: [],
      },
    ],
  },
];

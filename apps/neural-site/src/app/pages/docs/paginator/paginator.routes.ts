import type { Routes } from '@angular/router';

export const PAGINATOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./paginator.page').then((module) => module.PaginatorPage),
    title: 'Paginator — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Paginator Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Paginator API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Paginator Tokens — NeuralNg', children: [] },
    ],
  },
];

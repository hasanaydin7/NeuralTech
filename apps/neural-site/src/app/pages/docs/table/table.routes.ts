import type { Routes } from '@angular/router';

export const TABLE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./table.page').then((module) => module.TablePage),
    title: 'Table — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Table Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Table API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Table Tokens — NeuralNg', children: [] },
    ],
  },
];

import type { Routes } from '@angular/router';

export const TREE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./tree.page').then((m) => m.TreePage),
    title: 'Tree — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Tree Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Tree API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Tree Tokens — NeuralNg', children: [] },
    ],
  },
];

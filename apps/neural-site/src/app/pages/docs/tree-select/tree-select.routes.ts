import type { Routes } from '@angular/router';

export const TREE_SELECT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tree-select.page').then((m) => m.TreeSelectPage),
    title: 'TreeSelect — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'TreeSelect Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'TreeSelect API — NeuralNg', children: [] },
      { path: 'tokens', title: 'TreeSelect Tokens — NeuralNg', children: [] },
    ],
  },
];

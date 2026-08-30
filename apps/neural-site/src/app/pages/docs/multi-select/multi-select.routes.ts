import type { Routes } from '@angular/router';

export const MULTI_SELECT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./multi-select.page').then((module) => module.MultiSelectPage),
    title: 'MultiSelect — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'MultiSelect Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'MultiSelect API — NeuralNg', children: [] },
      {
        path: 'tokens',
        title: 'MultiSelect Tokens — NeuralNg',
        children: [],
      },
    ],
  },
];

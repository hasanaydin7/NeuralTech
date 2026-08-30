import type { Routes } from '@angular/router';

export const SELECT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./select.page').then((module) => module.SelectPage),
    title: 'Select — NeuralNg',
    children: [
      { path: 'accessibility', title: 'Select Accessibility — NeuralNg', children: [] },
      { path: 'api', title: 'Select API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Select Tokens — NeuralNg', children: [] },
    ],
  },
];

import type { Routes } from '@angular/router';

export const TOOLBAR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./toolbar.page').then((module) => module.ToolbarPage),
    title: 'Toolbar — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Toolbar Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Toolbar API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Toolbar Tokens — NeuralNg', children: [] },
    ],
  },
];

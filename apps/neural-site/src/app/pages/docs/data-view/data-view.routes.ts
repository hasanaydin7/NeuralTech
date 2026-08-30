import { Routes } from '@angular/router';

export const DATA_VIEW_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./data-view.page').then((module) => module.DataViewPage),
    title: 'DataView — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'DataView Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'DataView API — NeuralNg', children: [] },
      { path: 'tokens', title: 'DataView Tokens — NeuralNg', children: [] },
    ],
  },
];

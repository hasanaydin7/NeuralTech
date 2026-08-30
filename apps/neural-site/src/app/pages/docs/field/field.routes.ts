import { Routes } from '@angular/router';

export const FIELD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./field.page').then((module) => module.FieldPage),
    title: 'Field — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Field Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Field API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Field Tokens — NeuralNg', children: [] },
    ],
  },
];

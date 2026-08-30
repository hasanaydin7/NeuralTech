import { Routes } from '@angular/router';

export const CHECKBOX_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./checkbox.page').then((module) => module.CheckboxPage),
    title: 'Checkbox — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Checkbox Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Checkbox API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Checkbox Tokens — NeuralNg', children: [] },
    ],
  },
];

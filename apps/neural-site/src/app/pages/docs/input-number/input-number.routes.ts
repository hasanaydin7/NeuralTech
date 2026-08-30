import { Routes } from '@angular/router';

export const INPUT_NUMBER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./input-number.page').then((module) => module.InputNumberPage),
    title: 'InputNumber — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'InputNumber Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'InputNumber API — NeuralNg', children: [] },
      { path: 'tokens', title: 'InputNumber Tokens — NeuralNg', children: [] },
    ],
  },
];

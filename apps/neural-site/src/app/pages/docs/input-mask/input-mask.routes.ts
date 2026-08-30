import { Routes } from '@angular/router';

export const INPUT_MASK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./input-mask.page').then((module) => module.InputMaskPage),
    title: 'InputMask — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'InputMask Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'InputMask API — NeuralNg', children: [] },
      { path: 'tokens', title: 'InputMask Tokens — NeuralNg', children: [] },
    ],
  },
];

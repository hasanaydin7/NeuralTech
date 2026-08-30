import type { Routes } from '@angular/router';

export const SWITCH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./switch.page').then((module) => module.SwitchPage),
    title: 'Switch — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Switch Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Switch API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Switch Tokens — NeuralNg', children: [] },
    ],
  },
];

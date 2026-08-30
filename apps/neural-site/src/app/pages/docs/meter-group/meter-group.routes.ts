import type { Routes } from '@angular/router';

export const METER_GROUP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./meter-group.page').then((module) => module.MeterGroupPage),
    title: 'MeterGroup — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'MeterGroup Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'MeterGroup API — NeuralNg', children: [] },
      { path: 'tokens', title: 'MeterGroup Tokens — NeuralNg', children: [] },
    ],
  },
];

import type { Routes } from '@angular/router';

export const PROGRESS_BAR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./progress-bar.page').then((module) => module.ProgressBarPage),
    title: 'ProgressBar — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'ProgressBar Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'ProgressBar API — NeuralNg', children: [] },
      {
        path: 'tokens',
        title: 'ProgressBar Tokens — NeuralNg',
        children: [],
      },
    ],
  },
];

import type { Routes } from '@angular/router';

export const PROGRESS_SPINNER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./progress-spinner.page').then(
        (module) => module.ProgressSpinnerPage,
      ),
    title: 'ProgressSpinner — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'ProgressSpinner Accessibility — NeuralNg',
        children: [],
      },
      {
        path: 'api',
        title: 'ProgressSpinner API — NeuralNg',
        children: [],
      },
      {
        path: 'tokens',
        title: 'ProgressSpinner Tokens — NeuralNg',
        children: [],
      },
    ],
  },
];

import { Routes } from '@angular/router';

export const DIALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dialog.page').then((module) => module.DialogPage),
    title: 'Dialog — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Dialog Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Dialog API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Dialog Tokens — NeuralNg', children: [] },
    ],
  },
];

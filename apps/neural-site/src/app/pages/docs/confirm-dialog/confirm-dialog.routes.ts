import { Routes } from '@angular/router';

export const CONFIRM_DIALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./confirm-dialog.page').then(
        (module) => module.ConfirmDialogPage,
      ),
    title: 'ConfirmDialog — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'ConfirmDialog Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'ConfirmDialog API — NeuralNg', children: [] },
      {
        path: 'tokens',
        title: 'ConfirmDialog Tokens — NeuralNg',
        children: [],
      },
    ],
  },
];

import type { Routes } from '@angular/router';

export const TEXTAREA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./textarea.page').then((module) => module.TextareaPage),
    title: 'Textarea — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Textarea Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Textarea API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Textarea Tokens — NeuralNg', children: [] },
    ],
  },
];

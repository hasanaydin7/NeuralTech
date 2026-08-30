import { Routes } from '@angular/router';

export const EDITOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./editor.page').then((module) => module.EditorPage),
    title: 'Editor — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Editor Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Editor API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Editor Tokens — NeuralNg', children: [] },
    ],
  },
];

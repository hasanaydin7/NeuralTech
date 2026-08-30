import type { Routes } from '@angular/router';

export const TAG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./tag.page').then((module) => module.TagPage),
    title: 'Tag — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Tag Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Tag API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Tag Tokens — NeuralNg', children: [] },
    ],
  },
];

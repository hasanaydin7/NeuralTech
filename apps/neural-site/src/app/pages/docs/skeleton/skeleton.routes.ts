import type { Routes } from '@angular/router';

export const SKELETON_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./skeleton.page').then((module) => module.SkeletonPage),
    title: 'Skeleton — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Skeleton Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Skeleton API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Skeleton Tokens — NeuralNg', children: [] },
    ],
  },
];

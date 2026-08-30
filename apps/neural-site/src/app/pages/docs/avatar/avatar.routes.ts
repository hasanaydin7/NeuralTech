import type { Routes } from '@angular/router';

export const AVATAR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./avatar.page').then((module) => module.AvatarPage),
    title: 'Avatar — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Avatar Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Avatar API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Avatar Tokens — NeuralNg', children: [] },
    ],
  },
];

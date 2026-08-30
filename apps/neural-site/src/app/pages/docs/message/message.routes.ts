import type { Routes } from '@angular/router';

export const MESSAGE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./message.page').then((module) => module.MessagePage),
    title: 'Message — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Message Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Message API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Message Tokens — NeuralNg', children: [] },
    ],
  },
];

import { Routes } from '@angular/router';

export const DRAWER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./drawer.page').then((module) => module.DrawerPage),
    title: 'Drawer — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Drawer Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Drawer API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Drawer Tokens — NeuralNg', children: [] },
    ],
  },
];

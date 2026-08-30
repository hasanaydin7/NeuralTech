import type { Routes } from '@angular/router';

export const SIDEBAR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./sidebar.page').then((module) => module.SidebarPage),
    title: 'Sidebar — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Sidebar Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Sidebar API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Sidebar Tokens — NeuralNg', children: [] },
    ],
  },
];

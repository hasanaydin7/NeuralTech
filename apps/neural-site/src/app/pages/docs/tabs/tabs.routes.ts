import type { Routes } from '@angular/router';

export const TABS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tabs.page').then((module) => module.TabsPage),
    title: 'Tabs — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Tabs Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Tabs API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Tabs Tokens — NeuralNg', children: [] },
    ],
  },
];

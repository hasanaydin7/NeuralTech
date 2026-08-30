import type { Routes } from '@angular/router';

export const POPOVER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./popover.page').then((m) => m.PopoverPage),
    title: 'Popover — NeuralNg',
    children: [
      { path: 'accessibility', title: 'Popover Accessibility — NeuralNg', children: [] },
      { path: 'api', title: 'Popover API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Popover Tokens — NeuralNg', children: [] },
    ],
  },
];

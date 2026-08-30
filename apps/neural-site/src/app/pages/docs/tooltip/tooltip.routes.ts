import type { Routes } from '@angular/router';

export const TOOLTIP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tooltip.page').then((module) => module.TooltipPage),
    title: 'Tooltip — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Tooltip Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Tooltip API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Tooltip Tokens — NeuralNg', children: [] },
    ],
  },
];

import type { Routes } from '@angular/router';

export const VIRTUAL_SCROLLER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./virtual-scroller.page').then((m) => m.VirtualScrollerPage),
    title: 'VirtualScroller — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'VirtualScroller Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'VirtualScroller API — NeuralNg', children: [] },
      {
        path: 'tokens',
        title: 'VirtualScroller Tokens — NeuralNg',
        children: [],
      },
    ],
  },
];

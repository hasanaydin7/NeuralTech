import { Routes } from '@angular/router';

export const LOADING_OVERLAY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./loading-overlay.page').then(
        (module) => module.LoadingOverlayPage,
      ),
    title: 'LoadingOverlay — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'LoadingOverlay Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'LoadingOverlay API — NeuralNg', children: [] },
      {
        path: 'tokens',
        title: 'LoadingOverlay Tokens — NeuralNg',
        children: [],
      },
    ],
  },
];

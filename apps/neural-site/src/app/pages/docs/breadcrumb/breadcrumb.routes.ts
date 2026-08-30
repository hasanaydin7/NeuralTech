import { Routes } from '@angular/router';

export const BREADCRUMB_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./breadcrumb.page').then((module) => module.BreadcrumbPage),
    title: 'Breadcrumb — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Breadcrumb Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Breadcrumb API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Breadcrumb Tokens — NeuralNg', children: [] },
    ],
  },
];

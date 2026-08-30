import { type Routes } from '@angular/router';
import { SiteShell } from './layout/site-shell/site-shell';
import { LandingPage } from './pages/landing/landing.page';

export const appRoutes: Routes = [
  {
    path: '',
    component: SiteShell,
    children: [
      {
        path: '',
        title: 'NeuralNg — Angular UI for the AI era',
        component: LandingPage,
      },
      {
        path: 'docs',
        loadChildren: () =>
          import('./docs/docs.routes').then((routes) => routes.DOC_ROUTES),
      },
      {
        path: 'playground',
        title: 'Component Playground — NeuralNg',
        loadComponent: () =>
          import('./pages/playground/playground.page').then(
            (page) => page.PlaygroundPage,
          ),
      },
      {
        path: '**',
        title: 'Page not found — NeuralNg',
        loadComponent: () =>
          import('./pages/not-found/not-found.page').then(
            (page) => page.NotFoundPage,
          ),
      },
    ],
  },
];

import type { Routes } from '@angular/router';

export const PANEL_MENU_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./panel-menu.page').then((module) => module.PanelMenuPage),
    title: 'PanelMenu — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'PanelMenu Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'PanelMenu API — NeuralNg', children: [] },
      { path: 'tokens', title: 'PanelMenu Tokens — NeuralNg', children: [] },
    ],
  },
];

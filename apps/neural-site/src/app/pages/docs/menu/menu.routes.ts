import { Routes } from '@angular/router';

export const MENU_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./menu.page').then((module) => module.MenuPage),
    title: 'Menu — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Menu Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Menu API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Menu Tokens — NeuralNg', children: [] },
    ],
  },
];

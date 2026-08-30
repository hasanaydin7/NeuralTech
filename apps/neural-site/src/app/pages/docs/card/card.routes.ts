import { Routes } from '@angular/router';

export const CARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./card.page').then((module) => module.CardPage),
    title: 'Card — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Card Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Card API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Card Tokens — NeuralNg', children: [] },
    ],
  },
];

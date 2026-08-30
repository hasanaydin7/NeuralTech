import type { Routes } from '@angular/router';

export const ACCORDION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./accordion.page').then((module) => module.AccordionPage),
    title: 'Accordion — NeuralNg',
    children: [
      { path: 'accessibility', title: 'Accordion Accessibility — NeuralNg', children: [] },
      { path: 'api', title: 'Accordion API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Accordion Tokens — NeuralNg', children: [] },
    ],
  },
];

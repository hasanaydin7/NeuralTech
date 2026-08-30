import type { Routes } from '@angular/router';

export const SLIDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./slider.page').then((module) => module.SliderPage),
    title: 'Slider — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Slider Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Slider API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Slider Tokens — NeuralNg', children: [] },
    ],
  },
];

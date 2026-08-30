import type { Routes } from '@angular/router';
import { provideNeuralMessages } from '@neural-ng/core/message';
import { provideNeuralToast } from '@neural-ng/core/toast';

export const TOAST_ROUTES: Routes = [
  {
    path: '',
    providers: [provideNeuralMessages(), provideNeuralToast()],
    loadComponent: () =>
      import('./toast.page').then((module) => module.ToastPage),
    title: 'Toast — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Toast Accessibility — NeuralNg',
        children: [],
      },
      {
        path: 'api',
        title: 'Toast API — NeuralNg',
        children: [],
      },
      {
        path: 'tokens',
        title: 'Toast Tokens — NeuralNg',
        children: [],
      },
    ],
  },
];

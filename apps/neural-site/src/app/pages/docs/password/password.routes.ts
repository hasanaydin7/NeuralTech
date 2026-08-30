import type { Routes } from '@angular/router';
export const PASSWORD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./password.page').then((m) => m.PasswordPage),
    title: 'Password — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'Password Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'Password API — NeuralNg', children: [] },
      { path: 'tokens', title: 'Password Tokens — NeuralNg', children: [] },
    ],
  },
];

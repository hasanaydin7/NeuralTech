import { Routes } from '@angular/router';

export const INPUT_OTP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./input-otp.page').then((module) => module.InputOtpPage),
    title: 'InputOtp — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'InputOtp Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'InputOtp API — NeuralNg', children: [] },
      { path: 'tokens', title: 'InputOtp Tokens — NeuralNg', children: [] },
    ],
  },
];

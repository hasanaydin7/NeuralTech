import { Routes } from '@angular/router';

export const DATE_PICKER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./date-picker.page').then((module) => module.DatePickerPage),
    title: 'DatePicker — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'DatePicker Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'DatePicker API — NeuralNg', children: [] },
      {
        path: 'tokens',
        title: 'DatePicker Tokens — NeuralNg',
        children: [],
      },
    ],
  },
];

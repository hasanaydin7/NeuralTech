import { Routes } from '@angular/router';

export const FILE_UPLOAD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./file-upload.page').then((module) => module.FileUploadPage),
    title: 'FileUpload — NeuralNg',
    children: [
      {
        path: 'accessibility',
        title: 'FileUpload Accessibility — NeuralNg',
        children: [],
      },
      { path: 'api', title: 'FileUpload API — NeuralNg', children: [] },
      {
        path: 'tokens',
        title: 'FileUpload Tokens — NeuralNg',
        children: [],
      },
    ],
  },
];

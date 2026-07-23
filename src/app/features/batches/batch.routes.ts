import { Routes } from '@angular/router';

export const batchRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/batch-list/batch-list').then((m) => m.BatchListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/batch-form/batch-form').then((m) => m.BatchFormComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./components/batch-form/batch-form').then((m) => m.BatchFormComponent),
  }
];
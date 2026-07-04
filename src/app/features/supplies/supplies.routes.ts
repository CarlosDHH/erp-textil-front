import { Routes } from '@angular/router';

export const suppliesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/supply-list/supply-list').then((m) => m.SupplyListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/supply-form/supply-form').then((m) => m.SupplyFormComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./components/supply-form/supply-form').then((m) => m.SupplyFormComponent),
  }
];
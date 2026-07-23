import { Routes } from '@angular/router';

export const supplierRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/supplier-list/supplier-list').then((m) => m.SupplierListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/supplier-form/supplier-form').then((m) => m.SupplierFormComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./components/supplier-form/supplier-form').then((m) => m.SupplierFormComponent),
  }
];
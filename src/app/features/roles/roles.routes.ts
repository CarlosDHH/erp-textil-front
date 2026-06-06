import { Routes } from '@angular/router'
import { roleGuard } from '../../core/guards/role.guard'

export const rolesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/list/role-list.component').then((m) => m.RoleListComponent),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/form/role-form.component').then((m) => m.RoleFormComponent),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/form/role-form.component').then((m) => m.RoleFormComponent),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
]

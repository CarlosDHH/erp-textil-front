import { Routes } from '@angular/router'
import { roleGuard } from '../../core/guards/role.guard'
import { permissionGuard } from '../../core/guards/permission.guard'

export const rolesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/list/role-list.component').then((m) => m.RoleListComponent),
    // Cualquier rol con canView en "roles" puede entrar, no solo admin
    // (coherente con el backend: GET /api/roles es de lectura abierta a autenticados).
    canActivate: [permissionGuard('roles', 'canView')],
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

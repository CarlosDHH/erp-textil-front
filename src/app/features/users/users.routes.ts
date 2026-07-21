import { Routes } from '@angular/router'
import { roleGuard } from '../../core/guards/role.guard'

export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/list/user-list.component').then((m) => m.UserListComponent),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/form/user-form.component').then((m) => m.UserFormComponent),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/user-profile.component').then((m) => m.UserProfileComponent),
  },
  {
    path: 'profile/:id',
    loadComponent: () =>
      import('./pages/profile/user-profile.component').then((m) => m.UserProfileComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/form/user-form.component').then((m) => m.UserFormComponent),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
]


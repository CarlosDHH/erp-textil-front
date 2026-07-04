import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './shared/components/layout/layout';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'admin',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/users/users.routes').then((m) => m.usersRoutes),
      },
      {
        path: 'roles',
        loadChildren: () =>
          import('./features/roles/roles.routes').then((m) => m.rolesRoutes),
      },
      {
        path: 'supplies',
        loadChildren: () =>
        import('./features/supplies/supplies.routes').then((m) => m.suppliesRoutes),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];

import { Component, computed, inject, signal } from '@angular/core'
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { DrawerModule } from 'primeng/drawer';
import { Store } from '@ngrx/store'
import { Drawer } from 'primeng/drawer'
import { ButtonModule } from 'primeng/button'
import { AvatarModule } from 'primeng/avatar'
import { RippleModule } from 'primeng/ripple'
import { AsyncPipe } from '@angular/common'

import { logout } from '../../../features/auth/store/auth.actions'
import { selectUser } from '../../../features/auth/store/auth.selectors'
import { PermissionsService } from '../../../core/services/permissions.service'
import { RolePermissionFlags } from '../../../features/roles/services/role-permission.service'

interface NavItem {
  label: string
  icon: string
  route: string
  /** null = visible para cualquier usuario autenticado; si no, requiere ese permiso de módulo (admin siempre pasa). */
  permission: [string, keyof RolePermissionFlags] | null
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Drawer,
    ButtonModule,
    AvatarModule,
    RippleModule,
    AsyncPipe,
    CommonModule,
    RouterModule,
    MenuModule,
    DrawerModule,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class LayoutComponent {
  private store = inject(Store)
  private router = inject(Router)
  private permissionsService = inject(PermissionsService)

  user$ = this.store.select(selectUser)
  sidebarVisible = signal(false)
  isAdmin = this.permissionsService.isAdmin

  navItems: NavItem[] = [
    { label: 'Dashboard',    icon: 'pi pi-home',   route: '/admin/dashboard', permission: null },
    { label: 'Usuarios',     icon: 'pi pi-users',  route: '/admin/users',     permission: ['usuarios', 'canView'] },
    { label: 'Roles',        icon: 'pi pi-shield', route: '/admin/roles',     permission: ['roles', 'canView'] },
    { label: 'Insumos',      icon: 'pi pi-box',    route: '/admin/supplies',  permission: null },
    { label: 'Lotes',        icon: 'pi pi-box',    route: '/admin/batches',   permission: null },
    { label: 'Proveedores',  icon: 'pi pi-box',    route: '/admin/suppliers', permission: null },
  ]

  visibleNavItems = computed(() =>
    this.navItems.filter(
      (item) => !item.permission || this.permissionsService.hasPermission(item.permission[0], item.permission[1])
    )
  )

  toggleSidebar(): void {
    this.sidebarVisible.update(v => !v)
  }
goToOwnProfile(): void {
    this.sidebarVisible.set(false)
    this.router.navigate(['/admin/users/profile'])
  }


  onLogout(): void {
    this.store.dispatch(logout())
  }

  getInitials(name: string, lastName: string): string {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }
}


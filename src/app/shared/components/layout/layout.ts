import { Component, inject, signal } from '@angular/core'
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'
import { Store } from '@ngrx/store'
import { Drawer } from 'primeng/drawer'
import { ButtonModule } from 'primeng/button'
import { AvatarModule } from 'primeng/avatar'
import { RippleModule } from 'primeng/ripple'
import { AsyncPipe } from '@angular/common'

import { logout } from '../../../features/auth/store/auth.actions'
import { selectUser } from '../../../features/auth/store/auth.selectors'

interface NavItem {
  label: string
  icon: string
  route: string
  roles: string[]
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
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class LayoutComponent {
  private store = inject(Store)

  user$ = this.store.select(selectUser)
  sidebarVisible = signal(false)

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home',   route: '/admin/dashboard', roles: ['ADMIN', 'OPERATOR'] },
    { label: 'Usuarios',  icon: 'pi pi-users',  route: '/admin/users',     roles: ['ADMIN'] },
    { label: 'Roles',     icon: 'pi pi-shield', route: '/admin/roles',     roles: ['ADMIN'] },
  ]

  toggleSidebar(): void {
    this.sidebarVisible.update(v => !v)
  }

  onLogout(): void {
    this.store.dispatch(logout())
  }

  getInitials(name: string, lastName: string): string {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }
}

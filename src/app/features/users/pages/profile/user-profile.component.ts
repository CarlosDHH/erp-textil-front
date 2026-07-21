import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Store } from '@ngrx/store'
import { take } from 'rxjs/operators'
import { AvatarModule } from 'primeng/avatar'
import { TagModule } from 'primeng/tag'
import { ButtonModule } from 'primeng/button'
import { ToastModule } from 'primeng/toast'
import { MessageService } from 'primeng/api'

import { UserService, User } from '../../services/user.service'
import { RoleService } from '../../../roles/services/role.service'
import { selectUser } from '../../../auth/store/auth.selectors'

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [AvatarModule, TagModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit {
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private store = inject(Store)
  private userService = inject(UserService)
  private roleService = inject(RoleService)
  private messageService = inject(MessageService)

  user = signal<User | null>(null)
  roleActive = signal<boolean | null>(null)
  roleDescription = signal<string | null>(null)
  loading = signal(false)
  isOwnProfile = signal(false)

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id')
    if (routeId) {
      this.isOwnProfile.set(false)
      this.loadUser(routeId)
      return
    }

    this.store
      .select(selectUser)
      .pipe(take(1))
      .subscribe((sessionUser) => {
        this.isOwnProfile.set(true)
        if (sessionUser?.id) {
          this.loadUser(sessionUser.id)
        }
      })
  }

  loadUser(id: string): void {
    this.loading.set(true)
    this.userService.getById(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.user.set(res.data)
          this.loadRoleStatus(res.data.role)
        }
        this.loading.set(false)
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el perfil del usuario',
        })
        this.loading.set(false)
      },
    })
  }

  loadRoleStatus(roleName: string): void {
    this.roleService.getAll(1, 100).subscribe({
      next: (res) => {
        const role = res.data.data.find((r) => r.name === roleName)
        this.roleActive.set(role?.isActive ?? null)
        this.roleDescription.set(role?.description ?? null)
      },
    })
  }

  getInitials(name: string, lastName: string): string {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard'])
  }
}

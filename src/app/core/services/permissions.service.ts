import { Injectable, computed, effect, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Store } from '@ngrx/store'
import { catchError, forkJoin, of } from 'rxjs'

import { selectUser } from '../../features/auth/store/auth.selectors'
import { RoleService } from '../../features/roles/services/role.service'
import { AppModule, ModuleService } from '../../features/roles/services/module.service'
import {
  RolePermissionFlags,
  RolePermissionRecord,
  RolePermissionService,
} from '../../features/roles/services/role-permission.service'

/**
 * Fuente única de verdad para "¿puede el usuario activo hacer X en el módulo Y?".
 * Alimenta la directiva `*appHasPermission`, el `permissionGuard` de rutas y
 * cualquier chequeo de admin en el layout.
 *
 * `/roles`, `/modules` y `/roleModule` son de lectura abierta a cualquier usuario
 * autenticado en el backend (ver erp-textil-back/src/routes/*.routes.js), por eso
 * un rol no-admin puede resolver aquí sus propios permisos reales sin necesitar
 * privilegios de administrador.
 */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private roleService = inject(RoleService)
  private moduleService = inject(ModuleService)
  private rolePermissionService = inject(RolePermissionService)

  private user = toSignal(inject(Store).select(selectUser), { initialValue: null })

  isAdmin = computed(() => (this.user()?.role ?? '').toLowerCase() === 'admin')

  private modules = signal<AppModule[]>([])
  private permissions = signal<RolePermissionRecord[]>([])

  /** true en cuanto se puede confiar en `hasPermission(...)` (admin resuelto, o carga de permisos terminada). */
  ready = signal(false)

  constructor() {
    effect(() => {
      const user = this.user()
      if (!user) {
        this.modules.set([])
        this.permissions.set([])
        this.ready.set(false)
        return
      }
      if (this.isAdmin()) {
        this.modules.set([])
        this.permissions.set([])
        this.ready.set(true)
        return
      }
      this.ready.set(false)
      this.loadForRole(user.role)
    })
  }

  private loadForRole(roleName: string): void {
    forkJoin({
      roles: this.roleService.getAll(1, 100),
      modules: this.moduleService.getAll(1, 100),
      permissions: this.rolePermissionService.getAll(),
    })
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        if (!result) {
          this.modules.set([])
          this.permissions.set([])
          this.ready.set(true)
          return
        }
        const role = result.roles.data.data.find((r) => r.name === roleName)
        this.modules.set(result.modules.data.data)
        this.permissions.set(
          role ? result.permissions.data.filter((p) => p.roleId === role.id) : []
        )
        this.ready.set(true)
      })
  }

  hasPermission(moduleSlug: string, action: keyof RolePermissionFlags): boolean {
    if (this.isAdmin()) return true
    const module = this.modules().find((m) => m.slug === moduleSlug)
    if (!module) return false
    const permission = this.permissions().find((p) => p.moduleId === module.id)
    return !!permission?.[action]
  }
}

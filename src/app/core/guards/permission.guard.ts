import { inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { CanActivateFn, Router } from '@angular/router'
import { filter, map, take } from 'rxjs/operators'

import { PermissionsService } from '../services/permissions.service'
import { RolePermissionFlags } from '../../features/roles/services/role-permission.service'

/**
 * Bloquea el acceso a una ruta salvo que el rol activo tenga el flag indicado
 * (canView/canCreate/canEdit/canDelete) en el módulo dado. Los administradores
 * siempre pasan (ver `PermissionsService.isAdmin`).
 * Espera a que `PermissionsService.ready` sea true antes de decidir, para no
 * redirigir de más mientras los permisos del rol todavía se están cargando.
 */
export const permissionGuard = (
  moduleSlug: string,
  action: keyof RolePermissionFlags
): CanActivateFn => () => {
  const permissionsService = inject(PermissionsService)
  const router = inject(Router)

  return toObservable(permissionsService.ready).pipe(
    filter((ready) => ready),
    take(1),
    map(() =>
      permissionsService.hasPermission(moduleSlug, action)
        ? true
        : router.createUrlTree(['/admin/dashboard'])
    )
  )
}

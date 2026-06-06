import { inject } from '@angular/core'
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router'
import { Store } from '@ngrx/store'
import { map, take } from 'rxjs/operators'
import { selectUserRole } from '../../features/auth/store/auth.selectors'

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(Store)
  const router = inject(Router)
  const allowedRoles: string[] = route.data['roles'] ?? []

  return store.select(selectUserRole).pipe(
    take(1),
    map((role) => {
      const normalizedRole = role?.toLowerCase() ?? ''
      const allowed = allowedRoles.map((r) => r.toLowerCase())
      if (normalizedRole && allowed.includes(normalizedRole)) return true
      return router.createUrlTree(['/admin/dashboard'])
    })
  )
}

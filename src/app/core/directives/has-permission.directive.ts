import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core'

import { PermissionsService } from '../services/permissions.service'
import { RolePermissionFlags } from '../../features/roles/services/role-permission.service'

type PermissionAction = keyof RolePermissionFlags

/**
 * Oculta el contenido del template salvo que el rol activo tenga el permiso indicado.
 * Uso: `<button *appHasPermission="['almacen', 'canCreate']">Crear</button>`
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<unknown>)
  private viewContainerRef = inject(ViewContainerRef)
  private permissionsService = inject(PermissionsService)

  private moduleSlug: string | null = null
  private action: PermissionAction = 'canView'
  private hasView = false

  @Input({ required: true })
  set appHasPermission(value: [string, PermissionAction]) {
    ;[this.moduleSlug, this.action] = value
    this.updateView()
  }

  constructor() {
    effect(() => this.updateView())
  }

  private updateView(): void {
    if (!this.moduleSlug) return
    const allowed = this.permissionsService.hasPermission(this.moduleSlug, this.action)

    if (allowed && !this.hasView) {
      this.viewContainerRef.createEmbeddedView(this.templateRef)
      this.hasView = true
    } else if (!allowed && this.hasView) {
      this.viewContainerRef.clear()
      this.hasView = false
    }
  }
}

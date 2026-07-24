import { Component, inject, OnInit, signal } from '@angular/core'
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { Router, ActivatedRoute } from '@angular/router'
import { InputTextModule } from 'primeng/inputtext'
import { TextareaModule } from 'primeng/textarea'
import { SelectModule } from 'primeng/select'
import { ButtonModule } from 'primeng/button'
import { ToastModule } from 'primeng/toast'
import { CheckboxModule } from 'primeng/checkbox'
import { TooltipModule } from 'primeng/tooltip'
import { MessageService } from 'primeng/api'
import { Observable, forkJoin, of } from 'rxjs'

import { RoleService } from '../../services/role.service'
import { ModuleService } from '../../services/module.service'
import {
  RolePermissionFlags,
  RolePermissionRecord,
  RolePermissionResponse,
  RolePermissionService,
} from '../../services/role-permission.service'

interface PermissionRow {
  moduleId: string
  slug: string
  name: string
  permissionId: string | null
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ButtonModule,
    ToastModule,
    CheckboxModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss',
})
export class RoleFormComponent implements OnInit {
  private fb = inject(FormBuilder)
  private roleService = inject(RoleService)
  private moduleService = inject(ModuleService)
  private rolePermissionService = inject(RolePermissionService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private messageService = inject(MessageService)

  loading = signal(false)
  modulesLoading = signal(true)
  isEdit = signal(false)
  roleId = signal<string | null>(null)

  statusOptions = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ]

  form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    isActive: [true],
  })

  permissionRows = signal<PermissionRow[]>([])
  permissionsForm = new FormArray<FormGroup>([])

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')
    if (id) {
      this.isEdit.set(true)
      this.roleId.set(id)
      this.loadRole(id)
    }
    this.loadModulesAndPermissions()
  }

  loadRole(id: string): void {
    this.loading.set(true)
    this.roleService.getById(id).subscribe({
      next: (res) => {
        if (res.success) {
          const { name, description, isActive } = res.data
          this.form.patchValue({ name, description, isActive })
        }
        this.loading.set(false)
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el rol' })
        this.loading.set(false)
      },
    })
  }

  private loadModulesAndPermissions(): void {
    this.modulesLoading.set(true)
    const roleId = this.roleId()

    forkJoin({
      modules: this.moduleService.getAll(1, 100),
      permissions: this.rolePermissionService.getAll(),
    }).subscribe({
      next: ({ modules, permissions }) => {
        const modulesList = modules.data.data
        const existing: RolePermissionRecord[] = roleId
          ? permissions.data.filter((p) => p.roleId === roleId)
          : []

        const rows: PermissionRow[] = modulesList.map((m) => {
          const match = existing.find((p) => p.moduleId === m.id)
          return { moduleId: m.id, slug: m.slug, name: m.name, permissionId: match?.id ?? null }
        })

        this.permissionRows.set(rows)
        this.permissionsForm.clear()
        rows.forEach((row) => {
          const match = existing.find((p) => p.id === row.permissionId)
          const hasView = match?.canView ?? false
          const hasCreate = match?.canCreate ?? false
          const hasEdit = match?.canEdit ?? false
          const hasDelete = match?.canDelete ?? false
          const group = this.fb.group({
            // Crear/editar/eliminar implican poder ver: si alguno viene activo, "Ver" también lo está.
            canView: [hasView || hasCreate || hasEdit || hasDelete],
            canCreate: [hasCreate],
            canEdit: [hasEdit],
            canDelete: [hasDelete],
          })
          this.permissionsForm.push(group)
          this.enforceViewCoherence(group)
        })
        this.modulesLoading.set(false)
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los módulos y permisos',
        })
        this.modulesLoading.set(false)
      },
    })
  }

  permissionGroup(index: number): FormGroup {
    return this.permissionsForm.at(index)
  }

  /** "Ver" no puede desactivarse mientras Crear/Editar/Eliminar sigan activos en la misma fila. */
  viewLocked(index: number): boolean {
    const value = this.permissionGroup(index).value as RolePermissionFlags
    return !!(value.canCreate || value.canEdit || value.canDelete)
  }

  /**
   * Mantiene la coherencia "quien puede crear/editar/eliminar, también puede ver":
   * si se activa cualquiera de esos tres flags, fuerza `canView` a true en la misma fila.
   */
  private enforceViewCoherence(group: FormGroup): void {
    group.valueChanges.subscribe((value) => {
      const shouldView = value.canCreate || value.canEdit || value.canDelete
      if (shouldView && !value.canView) {
        group.patchValue({ canView: true }, { emitEvent: false })
      }
    })
  }

  onSubmit(): void {
    if (this.form.invalid) return

    this.loading.set(true)
    const value = this.form.value

    if (this.isEdit()) {
      const payload = {
        name: value.name!,
        description: value.description || undefined,
        isActive: value.isActive!,
      }

      this.roleService.update(this.roleId()!, payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.savePermissions(this.roleId()!, 'Rol actualizado')
          } else {
            this.loading.set(false)
          }
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el rol' })
          this.loading.set(false)
        },
      })
    } else {
      const payload = {
        name: value.name!,
        description: value.description || undefined,
      }

      this.roleService.create(payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.savePermissions(res.data.id, 'Rol creado')
          } else {
            this.loading.set(false)
          }
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el rol' })
          this.loading.set(false)
        },
      })
    }
  }

  private savePermissions(roleId: string, successMessage: string): void {
    const rows = this.permissionRows()
    const requests: Observable<RolePermissionResponse | null>[] = rows.map((row, i) => {
      const flags = this.permissionGroup(i).value as RolePermissionFlags

      if (row.permissionId) {
        return this.rolePermissionService.update(row.permissionId, flags)
      }

      const hasAny = flags.canView || flags.canCreate || flags.canEdit || flags.canDelete
      if (!hasAny) return of(null)

      return this.rolePermissionService.create({ roleId, moduleId: row.moduleId, ...flags })
    })

    forkJoin(requests.length ? requests : [of(null)]).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: successMessage })
        this.loading.set(false)
        setTimeout(() => this.router.navigate(['/admin/roles']), 1200)
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Permisos',
          detail: 'El rol se guardó, pero hubo un error al guardar algunos permisos',
        })
        this.loading.set(false)
      },
    })
  }

  goBack(): void {
    this.router.navigate(['/admin/roles'])
  }
}

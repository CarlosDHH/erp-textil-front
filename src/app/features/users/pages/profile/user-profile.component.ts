import { Component, inject, OnInit, signal } from '@angular/core'
import { DatePipe } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { Store } from '@ngrx/store'
import { forkJoin } from 'rxjs'
import { take } from 'rxjs/operators'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { AvatarModule } from 'primeng/avatar'
import { TagModule } from 'primeng/tag'
import { ButtonModule } from 'primeng/button'
import { ToastModule } from 'primeng/toast'
import { DialogModule } from 'primeng/dialog'
import { PasswordModule } from 'primeng/password'
import { TabsModule } from 'primeng/tabs'
import { MessageService } from 'primeng/api'
import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser'

import { UserService, User } from '../../services/user.service'
import { UserActivityService, InventoryMovement } from '../../services/user-activity.service'
import { RoleService, RolePermission } from '../../../roles/services/role.service'
import { ModuleService } from '../../../roles/services/module.service'
import { RolePermissionService } from '../../../roles/services/role-permission.service'
import { AuthService } from '../../../auth/services/auth.service'
import { selectUser } from '../../../auth/store/auth.selectors'

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    DatePipe,
    AvatarModule,
    TagModule,
    ButtonModule,
    ToastModule,
    DialogModule,
    PasswordModule,
    ReactiveFormsModule,
    TabsModule,
  ],
  providers: [MessageService],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit {
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private store = inject(Store)
  private fb = inject(FormBuilder)
  private userService = inject(UserService)
  private roleService = inject(RoleService)
  private moduleService = inject(ModuleService)
  private rolePermissionService = inject(RolePermissionService)
  private userActivityService = inject(UserActivityService)
  private authService = inject(AuthService)
  private messageService = inject(MessageService)

  user = signal<User | null>(null)
  roleActive = signal<boolean | null>(null)
  roleDescription = signal<string | null>(null)
  loading = signal(false)
  isOwnProfile = signal(false)

  // Mis Permisos
  permissions = signal<RolePermission[]>([])
  permissionsLoading = signal(false)

  // Actividad Reciente
  activity = signal<InventoryMovement[]>([])
  activityLoading = signal(false)
  activityError = signal<string | null>(null)

  // Registro biométrico
  webAuthnSupported = signal(false)
  showPasswordModal = signal(false)
  passwordVerifying = signal(false)
  passwordError = signal<string | null>(null)
  biometricRegistering = signal(false)
  passwordForm = this.fb.group({
    password: ['', [Validators.required]],
  })

  get password() { return this.passwordForm.get('password') }

  ngOnInit(): void {
    this.webAuthnSupported.set(browserSupportsWebAuthn())

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
          this.loadActivity(res.data.id)
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
        if (role?.id) {
          this.loadPermissions(role.id)
        }
      },
    })
  }

  loadPermissions(roleId: string): void {
    this.permissionsLoading.set(true)
    // El backend nunca incluye `permissions` al pedir un rol por id, así que se arma
    // la lista uniendo el catálogo de módulos con las filas rol↔módulo de `/roleModule`.
    forkJoin({
      modules: this.moduleService.getAll(1, 100),
      rolePermissions: this.rolePermissionService.getAll(),
    }).subscribe({
      next: ({ modules, rolePermissions }) => {
        const modulesList = modules.data.data
        const rows: RolePermission[] = rolePermissions.data
          .filter((p) => p.roleId === roleId)
          .map((p) => {
            const module = modulesList.find((m) => m.id === p.moduleId)
            return module
              ? {
                  id: p.id,
                  module: module.name,
                  canView: p.canView,
                  canCreate: p.canCreate,
                  canEdit: p.canEdit,
                  canDelete: p.canDelete,
                }
              : null
          })
          .filter((row): row is RolePermission => row !== null)

        this.permissions.set(rows)
        this.permissionsLoading.set(false)
      },
      error: () => this.permissionsLoading.set(false),
    })
  }

  loadActivity(userId: string): void {
    this.activityLoading.set(true)
    this.activityError.set(null)
    this.userActivityService.getByUser(userId, 1, 10).subscribe({
      next: (res) => {
        this.activity.set(res.data.data)
        this.activityLoading.set(false)
      },
      error: () => {
        this.activityError.set('No se pudo cargar la actividad reciente.')
        this.activityLoading.set(false)
      },
    })
  }

  getInitials(name: string, lastName: string): string {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  /** Traduce el tipo de movimiento del backend (inglés) a una etiqueta legible en español. */
  private readonly movementTypeLabels: Record<string, string> = {
    entry: 'Entrada',
    exit: 'Salida',
    adjustment: 'Ajuste',
    loss: 'Merma',
  }

  /** Severidad del `p-tag` por tipo de movimiento (mismo criterio de color en toda la app). */
  private readonly movementTypeSeverities: Record<string, 'success' | 'danger' | 'warn' | 'info'> = {
    entry: 'success',
    exit: 'info',
    adjustment: 'warn',
    loss: 'danger',
  }

  /** Icono de PrimeIcons por tipo de movimiento. */
  private readonly movementTypeIcons: Record<string, string> = {
    entry: 'pi pi-arrow-down-left',
    exit: 'pi pi-arrow-up-right',
    adjustment: 'pi pi-sliders-h',
    loss: 'pi pi-exclamation-triangle',
  }

  activityType(item: InventoryMovement): string {
    return this.movementTypeLabels[item.type] ?? item.type
  }

  activitySeverity(item: InventoryMovement): 'success' | 'danger' | 'warn' | 'info' {
    return this.movementTypeSeverities[item.type] ?? 'info'
  }

  activityIcon(item: InventoryMovement): string {
    return this.movementTypeIcons[item.type] ?? 'pi pi-history'
  }

  /** Nombre del insumo afectado (con el número de lote como respaldo). */
  activityTitle(item: InventoryMovement): string {
    return item.supplyName ?? item.batchNumber ?? 'Movimiento de inventario'
  }

  /** Cantidad con signo y unidad de medida, ej. "− 12 Metros". */
  activityQuantity(item: InventoryMovement): string | null {
    if (item.quantity == null) return null
    const sign = item.type === 'exit' || item.type === 'loss' ? '−' : '+'
    const unit = item.unitMeasure ? ` ${item.unitMeasure}` : ''
    return `${sign} ${item.quantity}${unit}`
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard'])
  }

  // ---- Registro biométrico ----

  openPasswordModal(): void {
    this.passwordForm.reset()
    this.passwordError.set(null)
    this.showPasswordModal.set(true)
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched()
      return
    }
    const email = this.user()?.email
    const password = this.passwordForm.value.password!
    if (!email) return

    this.passwordVerifying.set(true)
    this.passwordError.set(null)
    this.authService.verifyPassword(email, password).subscribe(({ valid, message }) => {
      this.passwordVerifying.set(false)
      if (!valid) {
        this.passwordError.set(message ?? 'Contraseña incorrecta. Inténtalo de nuevo.')
        return
      }
      this.showPasswordModal.set(false)
      this.registerBiometric()
    })
  }

  private registerBiometric(): void {
    this.biometricRegistering.set(true)
    this.authService.getBiometricRegisterOptions().subscribe({
      next: (optionsRes) => {
        if (!optionsRes.success) {
          this.biometricRegistering.set(false)
          this.messageService.add({
            severity: 'error',
            summary: 'Huella biométrica',
            detail: optionsRes.message,
          })
          return
        }

        startRegistration({ optionsJSON: optionsRes.data })
          .then((credential) => {
            this.authService.verifyBiometricRegister(credential).subscribe({
              next: (verifyRes) => {
                this.biometricRegistering.set(false)
                this.messageService.add({
                  severity: verifyRes.success ? 'success' : 'error',
                  summary: 'Huella biométrica',
                  detail: verifyRes.success
                    ? 'Tu huella/rostro se registró correctamente.'
                    : verifyRes.message,
                })
              },
              error: (err) => {
                this.biometricRegistering.set(false)
                this.messageService.add({
                  severity: 'error',
                  summary: 'Huella biométrica',
                  detail: err?.error?.message ?? 'No se pudo verificar el registro biométrico.',
                })
              },
            })
          })
          .catch((error: { name?: string }) => {
            this.biometricRegistering.set(false)
            const detail =
              error?.name === 'NotAllowedError'
                ? 'Registro biométrico cancelado.'
                : 'No se pudo completar el registro biométrico en este dispositivo.'
            this.messageService.add({ severity: 'error', summary: 'Huella biométrica', detail })
          })
      },
      error: (err) => {
        this.biometricRegistering.set(false)
        this.messageService.add({
          severity: 'error',
          summary: 'Huella biométrica',
          detail: err?.error?.message ?? 'No se pudo iniciar el registro biométrico.',
        })
      },
    })
  }
}


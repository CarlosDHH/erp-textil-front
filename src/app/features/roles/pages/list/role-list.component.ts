import { Component, inject, OnInit, signal } from '@angular/core'
import { Router } from '@angular/router'
import { TableModule } from 'primeng/table'
import { ButtonModule } from 'primeng/button'
import { TagModule } from 'primeng/tag'
import { InputTextModule } from 'primeng/inputtext'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ToastModule } from 'primeng/toast'
import { ConfirmationService, MessageService } from 'primeng/api'
import { FormsModule } from '@angular/forms'

import { RoleService, Role } from '../../services/role.service'
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive'

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    ConfirmDialogModule,
    ToastModule,
    FormsModule,
    HasPermissionDirective,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent implements OnInit {
  private roleService = inject(RoleService)
  private router = inject(Router)
  private confirmationService = inject(ConfirmationService)
  private messageService = inject(MessageService)

  roles = signal<Role[]>([])
  loading = signal(false)
  totalRecords = signal(0)
  searchTerm = signal('')

  page = 1
  limit = 20

  ngOnInit(): void {
    this.loadRoles()
  }

  loadRoles(): void {
    this.loading.set(true)
    this.roleService.getAll(this.page, this.limit, this.searchTerm()).subscribe({
      next: (res) => {
        if (res.success) {
          this.roles.set(res.data.data)
          this.totalRecords.set(res.data.meta.total)
        }
        this.loading.set(false)
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los roles' })
        this.loading.set(false)
      },
    })
  }

  onSearch(): void {
    this.page = 1
    this.loadRoles()
  }

  onPageChange(event: any): void {
    this.page = Math.floor(event.first / event.rows) + 1
    this.limit = event.rows
    this.loadRoles()
  }

  goToCreate(): void {
    this.router.navigate(['/admin/roles/new'])
  }

  goToEdit(id: string): void {
    this.router.navigate([`/admin/roles/${id}/edit`])
  }

  confirmDelete(role: Role): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el rol "${role.name}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteRole(role.id),
    })
  }

  deleteRole(id: string): void {
    this.roleService.remove(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol eliminado' })
          this.loadRoles()
        }
      },
      error: (err) => {
        const detail =
          err?.error?.statusCode === 409
            ? 'No se puede eliminar: el rol tiene usuarios asignados'
            : 'No se pudo eliminar el rol'
        this.messageService.add({ severity: 'error', summary: 'Error', detail })
      },
    })
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger'
  }
}

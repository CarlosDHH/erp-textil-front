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

import { UserService, User } from '../../services/user.service'

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    ConfirmDialogModule,
    ToastModule,
    FormsModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService)
  private router = inject(Router)
  private confirmationService = inject(ConfirmationService)
  private messageService = inject(MessageService)

  users = signal<User[]>([])
  loading = signal(false)
  totalRecords = signal(0)
  searchTerm = signal('')

  page = 1
  limit = 20

  ngOnInit(): void {
    this.loadUsers()
  }

  loadUsers(): void {
    this.loading.set(true)
    this.userService.getAll(this.page, this.limit, this.searchTerm()).subscribe({
      next: (res) => {
        if (res.success) {
          this.users.set(res.data.data)
          this.totalRecords.set(res.data.meta.total)
        }
        this.loading.set(false)
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios' })
        this.loading.set(false)
      },
    })
  }

  onSearch(): void {
    this.page = 1
    this.loadUsers()
  }

  onPageChange(event: any): void {
    this.page = Math.floor(event.first / event.rows) + 1
    this.limit = event.rows
    this.loadUsers()
  }

  goToCreate(): void {
    this.router.navigate(['/admin/users/new'])
  }

  goToEdit(id: string): void {
    this.router.navigate([`/admin/users/${id}/edit`])
  }

  goToProfile(id: string): void {
    this.router.navigate([`/admin/users/profile/${id}`])
  }

  confirmDelete(user: User): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar a ${user.name} ${user.lastName}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteUser(user.id),
    })
  }

  deleteUser(id: string): void {
    this.userService.remove(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario eliminado' })
          this.loadUsers()
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el usuario' })
      },
    })
  }

  getStatusSeverity(active: boolean): 'success' | 'danger' {
    return active ? 'success' : 'danger'
  }
}

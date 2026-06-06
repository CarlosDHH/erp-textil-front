import { Component, inject, OnInit, signal } from '@angular/core'
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms'
import { Router, ActivatedRoute } from '@angular/router'
import { InputTextModule } from 'primeng/inputtext'
import { TextareaModule } from 'primeng/textarea'
import { SelectModule } from 'primeng/select'
import { ButtonModule } from 'primeng/button'
import { ToastModule } from 'primeng/toast'
import { MessageService } from 'primeng/api'

import { RoleService } from '../../services/role.service'

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
  ],
  providers: [MessageService],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss',
})
export class RoleFormComponent implements OnInit {
  private fb = inject(FormBuilder)
  private roleService = inject(RoleService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private messageService = inject(MessageService)

  loading = signal(false)
  isEdit = signal(false)
  roleId = signal<string | null>(null)

  statusOptions = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ]

  form = this.fb.group({
    name:        ['', [Validators.required]],
    description: [''],
    isActive:    [true],
  })

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')
    if (id) {
      this.isEdit.set(true)
      this.roleId.set(id)
      this.loadRole(id)
    }
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
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol actualizado' })
            setTimeout(() => this.router.navigate(['/admin/roles']), 1500)
          }
          this.loading.set(false)
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
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol creado' })
            setTimeout(() => this.router.navigate(['/admin/roles']), 1500)
          }
          this.loading.set(false)
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el rol' })
          this.loading.set(false)
        },
      })
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/roles'])
  }
}

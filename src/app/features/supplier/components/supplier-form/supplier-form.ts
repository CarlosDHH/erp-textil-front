import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SupplierService } from '../../services/supplier';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, InputTextModule, ToastModule],
  providers: [MessageService],
  templateUrl: './supplier-form.html'
})
export class SupplierFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supplierService = inject(SupplierService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  form!: FormGroup;
  isEdit = false;
  supplierId?: string;
  saving = false;

  ngOnInit(): void {
    this.initForm();
    this.supplierId = this.route.snapshot.params['id'];
    
    if (this.supplierId) {
      this.isEdit = true;
      this.loadSupplierData(this.supplierId);
    }
  }

  initForm(): void {
      this.form = this.fb.group({
          name: ['', [Validators.required, Validators.maxLength(180)]],
          rfc: ['', [Validators.maxLength(13), Validators.pattern(/^([A-Z&Ñ]{3,4})(\d{6})([A-Z0-9]{3})$/)]],
          phone: ['', [Validators.maxLength(20), Validators.pattern(/^[0-9]+$/)]],
          email: ['', [Validators.email, Validators.maxLength(180)]],
          contactName: ['', [Validators.maxLength(120)]],
          active: [true]
      });
  }

  loadSupplierData(id: string): void {
    this.supplierService.getSupplierById(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.form.patchValue(res.data);
        }
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const supplier = this.form.getRawValue();
    if (this.isEdit) {
      this.supplierService.updateSupplier(this.supplierId!, supplier)
        .subscribe({
          next: () => {
            this.saving = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Proveedor actualizado',
              detail: 'Los datos fueron actualizados correctamente.'
            });
            this.router.navigate(['/admin/suppliers']);
          },
          error: () => {
            this.saving = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No fue posible actualizar el proveedor.'
            });
          }
        });
    } else {
      this.supplierService.createSupplier(supplier)
        .subscribe({
          next: () => {
            this.saving = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Proveedor registrado',
              detail: 'El proveedor fue registrado correctamente.'
            });
            this.router.navigate(['/admin/suppliers']);
          },
          error: () => {
            this.saving = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No fue posible registrar el proveedor.'
            });
          }
        });
    }
  }

  onNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '');
    value = value.replace(/\s+/g, ' ');
    value = value.trimStart();
    value = value.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    input.value = value;
    this.form.get('name')?.setValue(value, {
      emitEvent: false
    });
  }

  onRfcInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.toUpperCase();
    value = value.replace(/[^A-Z0-9&Ñ]/g, '');
    input.value = value;
    this.form.get('rfc')?.setValue(value, {
      emitEvent: false
    });
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/\D/g, '');
    input.value = value;
    this.form.get('phone')?.setValue(value, {
      emitEvent: false
    });
  }

  onContactInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '');
    value = value.replace(/\s+/g, ' ');
    value = value.trimStart();
    value = value.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    input.value = value;
    this.form.get('contactName')?.setValue(value, {
      emitEvent: false
    });
  }
}
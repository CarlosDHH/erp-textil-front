import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BatchService } from '../../services/batch.service';
import { SupplyService } from '../../../supplies/services/supply';
import { SupplierService } from '../../../supplier/services/supplier';
import { MATERIAL_TYPES, toHexColor } from '../../models/batch.constants';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-batch-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, InputTextModule, SelectModule, InputNumberModule, ToastModule, TextareaModule],
  providers: [MessageService],
  templateUrl: './batch-form.html'
})
export class BatchFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private batchService = inject(BatchService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private supplyService = inject(SupplyService);
  private supplierService = inject(SupplierService);
  private alertService = inject(AlertService);

  form!: FormGroup;
  isEdit = false;
  batchId?: string;
  codePlaceholder = 'Seleccione una categoría';
  saving = false;

  supplies: any[] = [];
  suppliers: any[] = [];
  materialTypes = MATERIAL_TYPES;

  ngOnInit(): void {
    this.initForm();
    this.loadSupplies();
    this.loadSuppliers();
    this.batchId = this.route.snapshot.params['id'];
    if (this.batchId) {
      this.isEdit = true;
      this.loadBatchData(this.batchId);
    } else {
      // Modo creación: el número de lote se autogenera (el campo está oculto en el HTML).
      this.form.patchValue({ batchNumber: this.generateBatchNumber() });
    }
  }

  /** Genera un número de lote con formato LOTE-YYYY-XXXX (XXXX aleatorio de 4 dígitos). */
  private generateBatchNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `LOTE-${year}-${random}`;
  }

  initForm(): void {
    this.form = this.fb.group({
      batchNumber: ['',[Validators.required,Validators.pattern(/^(?!-)(?!.*--)[A-Z0-9-]+(?<!-)$/),Validators.maxLength(30)]],
      supplyId: [null,Validators.required],
      supplierId: [null,Validators.required],
      initialQuantity: [0,[Validators.required,Validators.min(1)]],
      color: ['',[Validators.required,Validators.maxLength(40)]],
      materialType: ['',Validators.maxLength(60)],
      warehouseLocation: ['',[Validators.required,Validators.maxLength(60)]],
      entryDate: ['',Validators.required],
      notes: ['',Validators.maxLength(250)]
    });
  }

  loadBatchData(id: string): void {
    this.batchService.getBatchById(id).subscribe({
      next: (res) => {
        if (res.success) {
          const data = { ...res.data };
          // El <input type="date"> requiere formato yyyy-MM-dd.
          if (data.entryDate) {
            data.entryDate = String(data.entryDate).substring(0, 10);
          }
          this.form.patchValue(data);
        }
      }
    });
  }

  onSubmit(): void {
    // El número de lote está oculto; garantizamos que esté asignado antes del POST.
    if (!this.isEdit && !this.form.get('batchNumber')?.value) {
      this.form.patchValue({ batchNumber: this.generateBatchNumber() });
    }
    if (this.form.invalid) return;

    const batchData = this.form.value;
    this.saving = true;

    if (this.isEdit && this.batchId) {
      this.batchService.updateBatch(this.batchId, batchData).subscribe({
        next: () => {
          this.saving = false;
          this.alertService.toast('Lote actualizado');
          this.router.navigate(['/admin/batches']);
        },
        error: (error) => this.handleSaveError(error, 'No fue posible actualizar el lote.')
      });
    } else {
      this.batchService.createBatch(batchData).subscribe({
        next: () => {
          this.saving = false;
          this.alertService.toast('Lote registrado');
          this.router.navigate(['/admin/batches']);
        },
        error: (error) => this.handleSaveError(error, 'No fue posible registrar el lote.')
      });
    }
  }

  /**
   * El backend responde 400 cuando la cantidad solicitada no cabe en el lote o
   * en el stock del insumo (la transacción se revierte por completo). Ese caso
   * se distingue del resto para mostrar la alerta «Material insuficiente» con
   * el detalle de lo solicitado frente a lo disponible.
   */
  private handleSaveError(error: HttpErrorResponse, fallback: string): void {
    this.saving = false;
    const message = error?.error?.message;
    const details = error?.error?.data;

    if (error?.status === 400 && details?.available !== undefined) {
      this.alertService.insufficientStock(message);
      return;
    }

    this.alertService.error('No se pudo guardar el lote', message ?? fallback);
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.toUpperCase();
    value = value.replace(/[^A-Z0-9-]/g, '');
    value = value.replace(/--+/g, '-');
    value = value.replace(/^-/, '');
    value = value.replace(/-$/, '');
    input.value = value;
    this.form.get('code')?.setValue(value, {
      emitEvent: false
    });
  }

  onNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '');
    value = value.replace(/\s+/g, ' ');
    value = value.trimStart();
    value = value
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
    input.value = value;
    this.form.get('name')?.setValue(value, {
      emitEvent: false
    });
  }

  loadSupplies(): void {
    this.supplyService.getSupplies().subscribe({
      next: (res) => {
        if (res.success) {
          this.supplies = res.data.data;
        }
      }
    });
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers(1, 100).subscribe({
      next: (res) => {
        if (res.success) {
          this.suppliers = res.data.data;
        }
      }
    });
  }

  /** Valor hexadecimal válido (#rrggbb) para el <input type="color"> derivado del color actual. */
  get colorPickerValue(): string {
    return toHexColor(this.form.get('color')?.value);
  }

  /** Al elegir un color en la paleta se escribe el hexadecimal en el campo de texto. */
  onColorPick(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const control = this.form.get('color');
    control?.setValue(value);
    control?.markAsDirty();
  }
}
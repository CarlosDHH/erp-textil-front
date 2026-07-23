import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BatchService } from '../../services/batch.service';
import { SupplyService } from '../../../supplies/services/supply';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

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

  form!: FormGroup;
  isEdit = false;
  batchId?: string;
  codePlaceholder = 'Seleccione una categoría';
  saving = false;

  supplies: any[] = [];

  suppliers = [

    {
      id: 1,
      name: 'Textiles Hidalgo'
    },
    {
      id: 2,
      name: 'Hilaturas México'
    },
    {
      id: 3,
      name: 'Distribuidora del Centro'
    }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadSupplies();
    this.batchId = this.route.snapshot.params['id'];
    if (this.batchId) {
      this.isEdit = true;
      this.loadBatchData(this.batchId);
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      batchNumber: ['',[Validators.required,Validators.pattern(/^(?!-)(?!.*--)[A-Z0-9-]+(?<!-)$/),Validators.maxLength(30)]],
      supplyId: [null,Validators.required],
      supplierId: [null,Validators.required],
      initialQuantity: [0,[Validators.required,Validators.min(1)]],
      color: ['',[Validators.required,Validators.maxLength(40)]],
      warehouseLocation: ['',[Validators.required,Validators.maxLength(60)]],
      entryDate: ['',Validators.required],
      notes: ['',Validators.maxLength(250)]
    });
  }

  loadBatchData(id: string): void {
    this.batchService.getBatchById(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.form.patchValue(res.data);
        }
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const batchData = this.form.value;
    console.log('Datos enviados:', batchData);
    this.saving = true;

    if (this.isEdit && this.batchId) {
      this.batchService.updateBatch(this.batchId, batchData).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success)
            this.messageService.add({
              severity: 'success',
              summary: 'Actualización',
              detail: 'Los datos fueron actualizados.'
            });
            this.router.navigate(['/admin/batches']);
        },
        error: (error) => {
          this.saving = false;
          console.error(error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error?.error?.message ?? 'No fue posible registrar el lote.'
          });
        }
      });
    } else {
      this.batchService.createBatch(batchData).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success)
            this.messageService.add({
              severity: 'success',
              summary: 'Registro exitoso',
              detail: 'El insumo fue registrado correctamente.'
            });
            this.router.navigate(['/admin/batches']);
        },
        error: () => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No fue posible registrar el insumo.'
          });
        }
      });
    }
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
          console.log(this.supplies);
          console.log(res);
        }
      }
    });
  }
}
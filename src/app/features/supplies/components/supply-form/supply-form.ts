import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SupplyService } from '../../services/supply';
import { SelectModule } from 'primeng/select';
import { InputNumber } from "primeng/inputnumber";
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-supply-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, InputTextModule, SelectModule, InputNumberModule, InputNumber],
  templateUrl: './supply-form.html'
})
export class SupplyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supplyService = inject(SupplyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form!: FormGroup;
  isEdit = false;
  supplyId?: string;

  types = [
    {
      label: 'Tela',
      value: 'Tela'
    },
    {
      label: 'Botones',
      value: 'Botones'
    },
    {
      label: 'Hilos',
      value: 'Hilos'
    },
    {
      label: 'Piezas',
      value: 'Piezas'
    }
  ];

  units = [
    {
      label: 'Metros',
      value: 'Metros'
    },
    {
      label: 'Kilogramos',
      value: 'Kilogramos'
    },
    {
      label: 'Piezas',
      value: 'Piezas'
    }
  ];

  ngOnInit(): void {
    this.initForm();
    this.supplyId = this.route.snapshot.params['id'];
    
    if (this.supplyId) {
      this.isEdit = true;
      this.loadSupplyData(this.supplyId);
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^(?!-)(?!.*--)[A-Z0-9-]+(?<!-)$/)]],
      name: ['', [Validators.required]],
      type: ['', [Validators.required]],
      unitMeasure: ['', [Validators.required]],
      currentStock: [0, [Validators.required, Validators.min(0)]],
      minStock: [0, [Validators.required, Validators.min(0)]],
    },
  {
    validators: this.stockValidator()
  });
  }

  loadSupplyData(id: string): void {
    this.supplyService.getSupplyById(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.form.patchValue(res.data);
        }
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const supplyData = this.form.value;

    if (this.isEdit && this.supplyId) {
      this.supplyService.updateSupply(this.supplyId, supplyData).subscribe({
        next: (res) => {
          if (res.success) this.router.navigate(['/admin/supplies']);
        }
      });
    } else {
      this.supplyService.createSupply(supplyData).subscribe({
        next: (res) => {
          if (res.success) this.router.navigate(['/admin/supplies']);
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

  stockValidator(): ValidatorFn {

    return (group: AbstractControl) => {

      const stock =
        group.get('currentStock')?.value;

      const min =
        group.get('minStock')?.value;

      if (min > stock) {

        return {
          minGreaterThanStock: true
        };

      }

      return null;

    };

  }
}
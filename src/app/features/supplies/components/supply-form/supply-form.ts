import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SupplyService } from '../../services/supply';
import {
  SUPPLY_CATEGORIES,
  findCategoryConfig,
  isUnitAllowedForCategory,
  unitsForCategory,
} from '../../models/supply.constants';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-supply-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, InputTextModule, SelectModule, InputNumberModule, ToastModule],
  providers: [MessageService],
  templateUrl: './supply-form.html'
})
export class SupplyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supplyService = inject(SupplyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  form!: FormGroup;
  isEdit = false;
  supplyId?: string;
  codePlaceholder = 'Seleccione una categoría';
  saving = false;

  // Categorías en español; el valor guardado es la misma etiqueta.
  types = SUPPLY_CATEGORIES.map((c) => ({ label: c.label, value: c.label }));

  /**
   * Unidades ofrecidas por el selector. No es el catálogo completo: se recalcula
   * a partir de la categoría elegida para que sea imposible guardar combinaciones
   * incongruentes (ej. Hilos medidos en Metros).
   */
  units = unitsForCategory().map((u) => ({ label: u, value: u }));

  ngOnInit(): void {
    this.initForm();
    this.listenCategoryChanges();
    this.supplyId = this.route.snapshot.params['id'];

    if (this.supplyId) {
      this.isEdit = true;
      this.loadSupplyData(this.supplyId);
    }
  }

  initForm(): void {
    // Nota: no hay validador cruzado stockMínimo/stockActual: en este negocio es
    // válido registrar un insumo que ya está por debajo de su stock de seguridad.
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^(?!-)(?!.*--)[A-Z0-9-]+(?<!-)$/), Validators.maxLength(20)]],
      name: ['', [Validators.required, Validators.maxLength(80)]],
      type: ['', [Validators.required]],
      unitMeasure: ['', [Validators.required]],
      currentStock: [0, [Validators.required, Validators.min(0)]],
      minStock: [0, [Validators.required, Validators.min(0)]],
    }, { validators: this.categoryUnitValidator() });
  }

  /**
   * Al elegir una categoría: restringe las unidades de medida permitidas y genera
   * el código identificador automáticamente (prefijo de la categoría + sufijo
   * aleatorio de 4 dígitos, ej. TEL-8492). El código es de solo lectura en la plantilla.
   */
  private listenCategoryChanges(): void {
    this.form.get('type')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((category: string) => {
        const config = findCategoryConfig(category);
        if (!config) {
          this.codePlaceholder = 'Seleccione una categoría';
          this.syncUnitOptions(undefined);
          return;
        }

        // Congruencia estricta: el selector solo ofrece las unidades de la categoría.
        this.syncUnitOptions(category);

        // Código = prefijo del diccionario de categorías + sufijo aleatorio de 4 dígitos.
        const generatedCode = `${config.prefix}-${this.randomCodeSuffix()}`;
        this.form.patchValue({ code: generatedCode });
        this.codePlaceholder = generatedCode;
      });
  }

  /**
   * Recalcula las opciones del selector de unidad para la categoría dada.
   * Si la unidad actual dejó de ser válida se sustituye por la preferente
   * (primera de la lista), de modo que el formulario nunca queda incongruente.
   */
  private syncUnitOptions(category?: string): void {
    const allowed = unitsForCategory(category);
    this.units = allowed.map((u) => ({ label: u, value: u }));

    const control = this.form.get('unitMeasure');
    const current = control?.value;
    if (!current || !allowed.includes(current)) {
      control?.setValue(allowed[0] ?? '');
    }
  }

  /**
   * Validador cruzado categoría↔unidad. El selector ya impide elegir una unidad
   * inválida, pero este validador cubre los registros antiguos cargados en edición
   * que traen combinaciones incongruentes desde la base de datos.
   */
  private categoryUnitValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const type = group.get('type')?.value;
      const unit = group.get('unitMeasure')?.value;
      if (!type || !unit) return null;
      return isUnitAllowedForCategory(type, unit) ? null : { unitMismatch: true };
    };
  }

  /** Unidades permitidas para la categoría actual, en texto, para el mensaje de ayuda. */
  get allowedUnitsLabel(): string {
    return this.units.map((u) => u.label).join(' o ');
  }

  /** Sufijo numérico aleatorio de 4 dígitos (1000–9999). */
  private randomCodeSuffix(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  /**
   * Garantiza que el código esté generado antes de enviar (el campo está oculto en el HTML).
   * Si por algún motivo no se disparó el valueChanges de la categoría, lo genera aquí.
   */
  private ensureCodeGenerated(): void {
    if (this.form.get('code')?.value) return;
    const config = findCategoryConfig(this.form.get('type')?.value);
    if (config) {
      this.form.patchValue({ code: `${config.prefix}-${this.randomCodeSuffix()}` });
    }
  }

  loadSupplyData(id: string): void {
    this.supplyService.getSupplyById(id).subscribe({
      next: (res) => {
        if (res.success) {
          // emitEvent:false para no regenerar el código ni pisar la unidad guardada.
          this.form.patchValue(res.data, { emitEvent: false });
          // El selector debe ofrecer las unidades de la categoría del registro.
          this.units = unitsForCategory(res.data.type).map((u) => ({ label: u, value: u }));
          this.codePlaceholder = res.data.code ?? this.codePlaceholder;
          // patchValue con emitEvent:false no revalida el grupo; se fuerza para que
          // un registro antiguo con unidad incongruente se marque como inválido.
          this.form.updateValueAndValidity({ emitEvent: false });
        }
      }
    });
  }

  onSubmit(): void {
    // El código está oculto en el HTML; garantizamos que esté asignado antes de enviar.
    this.ensureCodeGenerated();
    if (this.form.invalid) return;

    const supplyData = this.form.value;
    this.saving = true;

    if (this.isEdit && this.supplyId) {
      this.supplyService.updateSupply(this.supplyId, supplyData).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success)
            this.messageService.add({
              severity: 'success',
              summary: 'Actualización',
              detail: 'Los datos fueron actualizados.'
            });
            this.router.navigate(['/admin/supplies']);
        },
        error: () => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No fue posible actualizar el insumo.'
          });
        }
      });
    } else {
      this.supplyService.createSupply(supplyData).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success)
            this.messageService.add({
              severity: 'success',
              summary: 'Registro exitoso',
              detail: 'El insumo fue registrado correctamente.'
            });
            this.router.navigate(['/admin/supplies']);
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
}

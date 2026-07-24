import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { Batch } from '../../models/batch.model';
import { resolveSwatchColor } from '../../models/batch.constants';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-batch-card',
  standalone: true,
  imports: [CommonModule, TagModule, ButtonModule, RouterModule, HasPermissionDirective],
  templateUrl: './batch-card.html'
})
export class BatchCardComponent {

  @Input({ required: true })
  batch!: Batch;

  @Output()
  delete = new EventEmitter<string>();

  get severity(): 'success' | 'warn' | 'danger' {
    if (this.batch.currentQuantity === 0) return 'danger';
    if (this.batch.currentQuantity <= (this.batch.initialQuantity * 0.2)) {
      return 'warn';
    }
    return 'success';
  }

  get statusLabel(): string {
    if (this.batch.currentQuantity === 0) return 'Agotado';
    if (this.batch.currentQuantity <= (this.batch.initialQuantity * 0.2)) {
      return 'Bajo';
    }
    return 'Disponible';
  }

  get stockColorClass(): string {
    if (this.batch.currentQuantity === 0) return 'text-red-600';
    if (this.batch.currentQuantity <= (this.batch.initialQuantity * 0.2)) {
      return 'text-orange-500';
    }
    return 'text-green-600';
  }

  /** Color CSS para el swatch, resuelto desde el hexadecimal o el nombre en español. */
  get swatchColor(): string {
    return resolveSwatchColor(this.batch.color);
  }

  onDelete(): void {
    this.delete.emit(this.batch.id);
  }
}

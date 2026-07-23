import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { Batch } from '../../models/batch.model';

@Component({
  selector: 'app-batch-card',
  standalone: true,
  imports: [CommonModule, TagModule, ButtonModule, RouterModule],
  templateUrl: './batch-card.html'
})
export class BatchCardComponent {

  @Input({ required: true })
  batch!: Batch;

  @Output()
  delete = new EventEmitter<number>();

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
  onDelete(): void {
    this.delete.emit(this.batch.id);
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { Supply } from '../../models/supply.model';
import { RouterModule } from '@angular/router';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-supply-card',
  standalone: true,
  imports: [CommonModule, TagModule, ButtonModule, RouterModule],
  templateUrl: './supply-card.component.html'
})
export class SupplyCardComponent {
  @Input({ required: true }) supply!: Supply;

  get severity(): 'success' | 'warn' | 'danger' {
    if (this.supply.currentStock === 0) return 'danger';
    if (this.supply.currentStock <= this.supply.minStock) return 'warn';
    return 'success';
  }

  get statusLabel(): string {
    if (this.supply.currentStock === 0) return 'Sin Stock';
    if (this.supply.currentStock <= this.supply.minStock) return 'Stock Crítico';
    return 'Normal';
  }

  get stockColorClass(): string {
    if (this.supply.currentStock === 0) return 'text-red-600';
    if (this.supply.currentStock <= this.supply.minStock) return 'text-orange-500';
    return 'text-green-600';
  }
  @Output()
  delete = new EventEmitter<string>();
  onDelete() {
    if (this.supply.id) {
      this.delete.emit(this.supply.id);
    }
  }
}
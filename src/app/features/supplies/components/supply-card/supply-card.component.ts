import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Supply } from '../../models/supply.model';
import { RouterModule } from '@angular/router';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';
import { categoryLabel, unitLabel } from '../../../../core/utils/inventory-labels';

@Component({
  selector: 'app-supply-card',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterModule, HasPermissionDirective],
  templateUrl: './supply-card.component.html'
})
export class SupplyCardComponent {
  @Input({ required: true }) supply!: Supply;

  @Output() delete = new EventEmitter<string>();

  // El backend devuelve los stocks como Decimal → string en JSON.
  // Se convierten a número para evitar comparaciones de cadenas.
  private get current(): number {
    return Number(this.supply.currentStock);
  }

  private get min(): number {
    return Number(this.supply.minStock);
  }

  /**
   * Estado del stock (siempre con conversión numérica):
   * - crítico:    stockActual <= stockMínimo
   * - precaución: stockMínimo < stockActual <= stockMínimo + 20
   * - normal:     stockActual > stockMínimo + 20
   */
  get stockState(): 'critical' | 'warning' | 'normal' {
    if (this.current <= this.min) return 'critical';
    if (this.current <= this.min + 20) return 'warning';
    return 'normal';
  }

  get statusLabel(): string {
    switch (this.stockState) {
      case 'critical':
        return this.current === 0 ? 'Sin Stock' : 'Stock Crítico';
      case 'warning':
        return 'Precaución';
      default:
        return 'Normal';
    }
  }

  /** Color del número de stock: rojo (crítico) / naranja (precaución) / verde (normal). */
  get stockColorClass(): string {
    switch (this.stockState) {
      case 'critical':
        return 'text-red-600';
      case 'warning':
        return 'text-orange-500';
      default:
        return 'text-green-600';
    }
  }

  /** Badge de estado: rojo (crítico) / naranja (precaución) / verde (normal). */
  get stockBadgeClass(): string {
    switch (this.stockState) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  }

  /** Unidad en español: los insumos de la carga inicial la guardan en inglés. */
  get unitLabel(): string {
    return unitLabel(this.supply.unitMeasure);
  }

  /** Categoría en español, por el mismo motivo. */
  get categoryLabel(): string {
    return categoryLabel(this.supply.type);
  }

  onDelete() {
    if (this.supply.id) {
      this.delete.emit(this.supply.id);
    }
  }
}

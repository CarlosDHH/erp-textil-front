import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Supplier } from '../../models/supplier.model';
import { RouterModule } from '@angular/router';
import { Output, EventEmitter } from '@angular/core';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-supplier-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TagModule,
    ButtonModule,
    ToggleSwitchModule,
    RouterModule,
    HasPermissionDirective,
  ],
  templateUrl: './supplier-card.html'
})
export class SupplierCardComponent {
  @Input({ required: true }) supplier!: Supplier;

  /** El padre marca la tarjeta mientras el PATCH de estado está en vuelo. */
  @Input() togglingActive = false;

  @Output()
  delete = new EventEmitter<string>();

  /** Emite el nuevo estado deseado; el padre persiste y confirma. */
  @Output()
  toggleActive = new EventEmitter<{ id: string; active: boolean }>();

  onDelete() {
    if (this.supplier.id) {
      this.delete.emit(this.supplier.id);
    }
  }

  /**
   * El switch usa binding de una sola vía: emite la intención y es el padre quien
   * actualiza `supplier.active` (de forma optimista) y lo revierte si el PATCH falla.
   * Así el switch y la etiqueta Activo/Inactivo nunca se contradicen.
   */
  onToggleActive(active: boolean): void {
    if (!this.supplier.id || active === this.supplier.active) return;
    this.toggleActive.emit({ id: this.supplier.id, active });
  }
}
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { Supplier } from '../../models/supplier.model';
import { RouterModule } from '@angular/router';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-supplier-card',
  standalone: true,
  imports: [CommonModule, TagModule, ButtonModule, RouterModule],
  templateUrl: './supplier-card.html'
})
export class SupplierCardComponent {
  @Input({ required: true }) supplier!: Supplier;
  @Output()
  delete = new EventEmitter<string>();
  onDelete() {
    if (this.supplier.id) {
      this.delete.emit(this.supplier.id);
    }
  }
}
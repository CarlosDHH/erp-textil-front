import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SupplierService } from '../../services/supplier';
import { Supplier } from '../../models/supplier.model';
import { SupplierCardComponent } from '../supplier-card/supplier-card';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, InputTextModule, SupplierCardComponent],
  templateUrl: './supplier-list.html'
})
export class SupplierListComponent implements OnInit {
  private supplierService = inject(SupplierService);

  suppliers: Supplier[] = [];
  totalRecords = 0;
  loading = false;
  page = 1;
  limit = 20;
  search = '';

  ngOnInit(): void {
    this.fetchSupplier();
  }

  fetchSupplier(): void {
    this.loading = true;
    this.supplierService.getSuppliers(this.page, this.limit, this.search).subscribe({
      next: (res) => {
        if (res.success) {
          this.suppliers = res.data.data;
          this.totalRecords = res.data.meta.total;
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadSupplier(event: any): void {
    this.page = (event.first / event.rows) + 1;
    this.limit = event.rows;
    this.fetchSupplier();
  }

  onSearch(event: any): void {
    this.search = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.fetchSupplier();
  }

  deleteSupplier(id: string): void {
    console.log("Eliminar:", id);
    if (confirm('¿Estás seguro de que deseas eliminar este material del inventario?')) {
      this.supplierService.deleteSupplier(id).subscribe({
        next: () => {
          console.log("Proveedor eliminado");
          this.fetchSupplier();
        },
        error: (err) => {
          console.error("Error eliminando proveedor", err);
        }
      });
    }
  }
}
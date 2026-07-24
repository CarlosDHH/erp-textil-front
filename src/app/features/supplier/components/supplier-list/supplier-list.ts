import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SupplierService } from '../../services/supplier';
import { Supplier } from '../../models/supplier.model';
import { SupplierCardComponent } from '../supplier-card/supplier-card';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SupplierCardComponent,
    HasPermissionDirective,
  ],
  templateUrl: './supplier-list.html'
})
export class SupplierListComponent implements OnInit {
  private supplierService = inject(SupplierService);
  private alertService = inject(AlertService);

  suppliers: Supplier[] = [];
  totalRecords = 0;
  loading = false;
  page = 1;
  limit = 20;
  search = '';

  /** Ids con un PATCH de estado en vuelo, para deshabilitar su switch. */
  togglingIds = new Set<string>();

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

  isToggling(id?: string): boolean {
    return !!id && this.togglingIds.has(id);
  }

  /**
   * Persiste el cambio de estado con PATCH /suppliers/:id.
   * La UI se actualiza de forma optimista y se revierte si el backend falla,
   * de modo que lo que se ve siempre corresponde a lo guardado.
   */
  onToggleActive({ id, active }: { id: string; active: boolean }): void {
    const supplier = this.suppliers.find((s) => s.id === id);
    if (!supplier) return;

    const previous = supplier.active;
    supplier.active = active;
    this.togglingIds.add(id);

    this.supplierService.updateSupplier(id, { active }).subscribe({
      next: (res) => {
        this.togglingIds.delete(id);
        if (res?.success === false) {
          supplier.active = previous;
          this.alertService.error('No se pudo actualizar', res.message);
          return;
        }
        // Se refleja el valor confirmado por la base de datos, no el optimista.
        supplier.active = res?.data?.active ?? active;
        this.alertService.toast(
          supplier.active ? 'Proveedor activado' : 'Proveedor desactivado',
        );
      },
      error: (err) => {
        this.togglingIds.delete(id);
        supplier.active = previous;
        this.alertService.error(
          'No se pudo actualizar el estado',
          err?.error?.message ?? 'Revisa tu conexión e inténtalo de nuevo.',
        );
      },
    });
  }

  deleteSupplier(id: string): void {
    const supplier = this.suppliers.find((s) => s.id === id);

    this.alertService
      .confirmDelete({
        title: '¿Eliminar proveedor?',
        text: supplier
          ? `«${supplier.name}» quedará desactivado y dejará de aparecer para nuevas compras.`
          : 'El proveedor quedará desactivado y dejará de aparecer para nuevas compras.',
        confirmText: 'Sí, eliminar',
      })
      .then((result) => {
        if (!result.isConfirmed) return;

        this.supplierService.deleteSupplier(id).subscribe({
          next: () => {
            this.alertService.success('Proveedor eliminado');
            this.fetchSupplier();
          },
          error: (err) => {
            this.alertService.error(
              'No se pudo eliminar el proveedor',
              err?.error?.message ?? 'Inténtalo de nuevo más tarde.',
            );
          },
        });
      });
  }
}

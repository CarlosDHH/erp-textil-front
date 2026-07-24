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
import { PdfReportService } from '../../../../core/services/pdf-report.service';

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
  private pdfReportService = inject(PdfReportService);

  suppliers: Supplier[] = [];
  totalRecords = 0;
  loading = false;
  exporting = false;
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

  /**
   * Reporte PDF del padrón de proveedores con sus datos de contacto.
   * Se reconsulta el listado completo con el filtro vigente para no exportar
   * únicamente la página en pantalla; los inactivos salen resaltados.
   */
  exportPdf(): void {
    this.exporting = true;

    this.supplierService.getSuppliers(1, 1000, this.search).subscribe({
      next: async (res) => {
        const rows: Supplier[] = res?.success ? res.data.data : [];

        if (rows.length === 0) {
          this.exporting = false;
          this.alertService.error(
            'No hay datos para exportar',
            'No se encontraron proveedores con los filtros actuales.',
          );
          return;
        }

        const active = rows.filter((s) => s.active).length;

        try {
          await this.pdfReportService.generate<Supplier>({
            title: 'Padrón de Proveedores',
            subtitle: this.search
              ? `Filtro aplicado: «${this.search}»`
              : 'Directorio de proveedores registrados',
            fileName: 'reporte-proveedores',
            orientation: 'landscape',
            rows,
            totals: [
              { label: 'Proveedores', value: String(rows.length) },
              { label: 'Activos', value: `${active} de ${rows.length}` },
            ],
            highlightRow: (s) => !s.active,
            columns: [
              { header: 'Proveedor', value: (s) => s.name },
              { header: 'RFC', value: (s) => s.rfc || '—', width: 32 },
              { header: 'Contacto', value: (s) => s.contactName || '—', width: 42 },
              { header: 'Teléfono', value: (s) => s.phone || '—', width: 30 },
              { header: 'Correo', value: (s) => s.email || '—' },
              {
                header: 'Estado',
                value: (s) => (s.active ? 'Activo' : 'Inactivo'),
                width: 22,
              },
              {
                header: 'Alta',
                value: (s) => this.formatDate(s.createdAt),
                width: 24,
              },
            ],
          });
          this.alertService.toast('Reporte descargado');
        } catch {
          this.alertService.error(
            'No se pudo generar el reporte',
            'Ocurrió un problema al construir el PDF.',
          );
        } finally {
          this.exporting = false;
        }
      },
      error: () => {
        this.exporting = false;
        this.alertService.error(
          'No se pudo generar el reporte',
          'No fue posible obtener los proveedores.',
        );
      },
    });
  }

  private formatDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-MX');
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

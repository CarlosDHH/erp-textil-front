import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SupplyService } from '../../services/supply';
import { Supply } from '../../models/supply.model';
import { SupplyCardComponent } from '../supply-card/supply-card.component';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';
import { AlertService } from '../../../../core/services/alert.service';
import { PdfReportService } from '../../../../core/services/pdf-report.service';

@Component({
  selector: 'app-supply-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SupplyCardComponent,
    HasPermissionDirective,
  ],
  templateUrl: './supply-list.html'
})
export class SupplyListComponent implements OnInit {
  private supplyService = inject(SupplyService);
  private alertService = inject(AlertService);
  private pdfReportService = inject(PdfReportService);

  supplies: Supply[] = [];
  totalRecords = 0;
  loading = false;
  exporting = false;
  page = 1;
  limit = 20;
  search = '';

  ngOnInit(): void {
    this.fetchSupplies();
  }

  fetchSupplies(): void {
    this.loading = true;
    this.supplyService.getSupplies(this.page, this.limit, this.search).subscribe({
      next: (res) => {
        if (res.success) {
          this.supplies = res.data.data;
          this.totalRecords = res.data.meta.total;
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadSupplies(event: any): void {
    this.page = (event.first / event.rows) + 1;
    this.limit = event.rows;
    this.fetchSupplies();
  }

  onSearch(event: any): void {
    this.search = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.fetchSupplies();
  }

  /**
   * Reporte PDF del inventario.
   *
   * No exporta la página visible: vuelve a pedir el catálogo completo (aplicando
   * el mismo texto de búsqueda) para que el documento no dependa de la
   * paginación en pantalla. Los insumos por debajo del mínimo salen resaltados.
   */
  exportPdf(): void {
    this.exporting = true;

    this.supplyService.getSupplies(1, 1000, this.search).subscribe({
      next: async (res) => {
        const rows: Supply[] = res?.success ? res.data.data : [];

        if (rows.length === 0) {
          this.exporting = false;
          this.alertService.error(
            'No hay datos para exportar',
            'No se encontraron insumos con los filtros actuales.',
          );
          return;
        }

        const critical = rows.filter((s) => Number(s.currentStock) <= Number(s.minStock));

        try {
          await this.pdfReportService.generate<Supply>({
            title: 'Inventario de Insumos',
            subtitle: this.search
              ? `Filtro aplicado: «${this.search}»`
              : 'Catálogo completo de materias primas',
            fileName: 'reporte-insumos',
            rows,
            totals: [
              { label: 'Insumos', value: String(rows.length) },
              { label: 'En stock crítico', value: String(critical.length) },
            ],
            highlightRow: (s) => Number(s.currentStock) <= Number(s.minStock),
            columns: [
              { header: 'Código', value: (s) => s.code ?? '—', width: 26 },
              { header: 'Insumo', value: (s) => s.name },
              { header: 'Categoría', value: (s) => s.type ?? '—', width: 28 },
              { header: 'Unidad', value: (s) => s.unitMeasure ?? '—', width: 24 },
              {
                header: 'Stock actual',
                value: (s) => this.formatQuantity(s.currentStock),
                width: 26,
                align: 'right',
              },
              {
                header: 'Stock mínimo',
                value: (s) => this.formatQuantity(s.minStock),
                width: 26,
                align: 'right',
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
          'No fue posible obtener el inventario.',
        );
      },
    });
  }

  private formatQuantity(value: number | undefined): string {
    return Number(value ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 2 });
  }

  deleteSupply(id: string): void {
    const supply = this.supplies.find((s) => s.id === id);

    this.alertService
      .confirmDelete({
        title: '¿Eliminar insumo?',
        text: supply
          ? `«${supply.name}» dejará de estar disponible en el inventario.`
          : 'El material dejará de estar disponible en el inventario.',
        confirmText: 'Sí, eliminar',
      })
      .then((result) => {
        if (!result.isConfirmed) return;

        this.supplyService.deleteSupply(id).subscribe({
          next: (res) => {
            if (res?.success === false) {
              this.alertService.error('No se pudo eliminar el insumo', res.message);
              return;
            }
            this.alertService.success('Insumo eliminado');
            this.fetchSupplies();
          },
          error: (err) => {
            this.alertService.error(
              'No se pudo eliminar el insumo',
              err?.error?.message ?? 'Inténtalo de nuevo más tarde.',
            );
          },
        });
      });
  }
}
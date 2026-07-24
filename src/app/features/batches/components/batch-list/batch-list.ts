import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { BatchService } from '../../services/batch.service';
import { Batch } from '../../models/batch.model';
import { BatchCardComponent } from '../batch-card/batch-card';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';
import { AlertService } from '../../../../core/services/alert.service';
import { PdfReportService } from '../../../../core/services/pdf-report.service';

@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    BatchCardComponent,
    HasPermissionDirective,
  ],
  templateUrl: './batch-list.html'
})
export class BatchListComponent implements OnInit {
  private batchService = inject(BatchService);
  private alertService = inject(AlertService);
  private pdfReportService = inject(PdfReportService);

  batches: Batch[] = [];
  totalRecords = 0;
  loading = false;
  exporting = false;
  page = 1;
  limit = 20;
  search = '';

  ngOnInit(): void {
    this.fetchBatches();
  }

  fetchBatches(): void {
    this.loading = true;
    this.batchService.getBatches(this.page, this.limit, this.search).subscribe({
      next: (res) => {
        if (res.success) {
          this.batches = res.data.data;
          this.totalRecords = res.data.meta.total;
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadBatches(event: any): void {
    this.page = (event.first / event.rows) + 1;
    this.limit = event.rows;
    this.fetchBatches();
  }

  onSearch(event: any): void {
    this.search = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.fetchBatches();
  }

  /**
   * Reporte PDF de lotes en existencia. Se vuelve a consultar el listado
   * completo (con el mismo filtro de búsqueda) para no exportar solo la página
   * visible; los lotes agotados o casi agotados salen resaltados.
   */
  exportPdf(): void {
    this.exporting = true;

    this.batchService.getBatches(1, 1000, this.search).subscribe({
      next: async (res) => {
        const rows: Batch[] = res?.success ? res.data.data : [];

        if (rows.length === 0) {
          this.exporting = false;
          this.alertService.error(
            'No hay datos para exportar',
            'No se encontraron lotes con los filtros actuales.',
          );
          return;
        }

        const depleted = rows.filter((b) => Number(b.currentQuantity) === 0);

        try {
          await this.pdfReportService.generate<Batch>({
            title: 'Existencias por Lote',
            subtitle: this.search
              ? `Filtro aplicado: «${this.search}»`
              : 'Lotes registrados en almacén',
            fileName: 'reporte-lotes',
            orientation: 'landscape',
            rows,
            totals: [
              { label: 'Lotes', value: String(rows.length) },
              { label: 'Agotados', value: String(depleted.length) },
            ],
            // Se resalta lo que está agotado o por debajo del 20% del inicial,
            // el mismo criterio de color que usa la tarjeta en pantalla.
            highlightRow: (b) =>
              Number(b.currentQuantity) <= Number(b.initialQuantity) * 0.2,
            columns: [
              { header: 'Lote', value: (b) => b.batchNumber, width: 34 },
              { header: 'Insumo', value: (b) => b.supplyName ?? '—' },
              { header: 'Proveedor', value: (b) => b.supplierName ?? '—' },
              { header: 'Color', value: (b) => b.color || '—', width: 24 },
              { header: 'Ubicación', value: (b) => b.warehouseLocation || '—', width: 26 },
              {
                header: 'Cant. inicial',
                value: (b) => this.formatQuantity(b.initialQuantity),
                width: 24,
                align: 'right',
              },
              {
                header: 'Stock actual',
                value: (b) => this.formatQuantity(b.currentQuantity),
                width: 24,
                align: 'right',
              },
              {
                header: 'Entrada',
                value: (b) => this.formatDate(b.entryDate),
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
          'No fue posible obtener los lotes.',
        );
      },
    });
  }

  private formatQuantity(value: number | undefined): string {
    return Number(value ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 2 });
  }

  private formatDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-MX');
  }

  /**
   * Eliminar un lote devuelve al inventario la cantidad que aún tenía, por eso
   * la confirmación advierte del efecto sobre el stock del insumo.
   */
  deleteBatch(id: string): void {
    const batch = this.batches.find((b) => b.id === id);

    this.alertService
      .confirmDelete({
        title: '¿Eliminar lote?',
        text: batch
          ? `Se eliminará el lote ${batch.batchNumber} y se descontarán del inventario las ${batch.currentQuantity} unidades que aún tiene disponibles.`
          : 'Se eliminará el lote y se ajustará el inventario del insumo.',
        confirmText: 'Sí, eliminar',
      })
      .then((result) => {
        if (!result.isConfirmed) return;

        this.batchService.deleteBatch(id).subscribe({
          next: (res) => {
            if (res?.success === false) {
              this.alertService.error('No se pudo eliminar el lote', res.message);
              return;
            }
            this.alertService.success('Lote eliminado');
            this.fetchBatches();
          },
          error: (err) => {
            this.alertService.error(
              'No se pudo eliminar el lote',
              err?.error?.message ?? 'Inténtalo de nuevo más tarde.',
            );
          },
        });
      });
  }
}

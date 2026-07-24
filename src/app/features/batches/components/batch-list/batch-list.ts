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

  batches: Batch[] = [];
  totalRecords = 0;
  loading = false;
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

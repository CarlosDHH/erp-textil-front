import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BatchService } from '../../services/batch.service';
import { Batch } from '../../models/batch.model';
import { BatchCardComponent } from '../batch-card/batch-card';

@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, InputTextModule, BatchCardComponent],
  templateUrl: './batch-list.html'
})
export class BatchListComponent implements OnInit {
  private batchService = inject(BatchService);

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

  deleteBatch(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este material del inventario?')) {
      this.batchService.deleteBatch(id.toString()).subscribe({
        next: () => this.fetchBatches()
      });
    }
  }
}
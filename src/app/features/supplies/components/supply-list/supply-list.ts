import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SupplyService } from '../../services/supply';
import { Supply } from '../../models/supply.model';

@Component({
  selector: 'app-supply-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, InputTextModule],
  templateUrl: './supply-list.html'
})
export class SupplyListComponent implements OnInit {
  private supplyService = inject(SupplyService);

  supplies: Supply[] = [];
  totalRecords = 0;
  loading = false;
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

  deleteSupply(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este material del inventario?')) {
      this.supplyService.deleteSupply(id).subscribe({
        next: () => this.fetchSupplies()
      });
    }
  }
}
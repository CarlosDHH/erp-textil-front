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
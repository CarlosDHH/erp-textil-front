import { Component, inject, signal } from '@angular/core'
import { DatePipe, DecimalPipe } from '@angular/common'
import { SelectButtonModule } from 'primeng/selectbutton'
import { TagModule } from 'primeng/tag'
import { FormsModule } from '@angular/forms'

import { DashboardService } from '../../services/dashboard.service'
import { DiscountRange, DiscountSummary } from '../../models/dashboard.model'

/**
 * «Resumen de Descontación de Insumos»: qué material salió del almacén hoy o
 * en la semana en curso, agrupado por insumo.
 *
 * Los datos vienen de los movimientos de inventario reales (tipos `exit` y
 * `loss`); no hay valores simulados. Si el panel aparece vacío es porque no se
 * han registrado salidas en el periodo.
 */
@Component({
  selector: 'app-discount-summary',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, SelectButtonModule, TagModule],
  templateUrl: './discount-summary.component.html',
  styleUrl: './discount-summary.component.scss',
})
export class DiscountSummaryComponent {
  private dashboardService = inject(DashboardService)

  readonly rangeOptions = [
    { label: 'Hoy', value: 'day' as DiscountRange },
    { label: 'Esta semana', value: 'week' as DiscountRange },
  ]

  range = signal<DiscountRange>('day')
  summary = signal<DiscountSummary | null>(null)
  loading = signal(false)
  errorMessage = signal<string | null>(null)

  constructor() {
    this.load('day')
  }

  onRangeChange(range: DiscountRange): void {
    if (!range || range === this.range()) return
    this.range.set(range)
    this.load(range)
  }

  load(range: DiscountRange): void {
    this.loading.set(true)
    this.errorMessage.set(null)

    this.dashboardService.getDiscountSummary(range).subscribe({
      next: (summary) => {
        this.summary.set(summary)
        this.loading.set(false)
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message)
        this.summary.set(null)
        this.loading.set(false)
      },
    })
  }
}

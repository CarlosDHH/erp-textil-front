import { Component, inject, signal } from '@angular/core'
import { AsyncPipe, DatePipe } from '@angular/common'
import { Store } from '@ngrx/store'
import { AvatarModule } from 'primeng/avatar'
import { Observable, catchError, of, shareReplay, tap } from 'rxjs'

import { selectUser } from '../auth/store/auth.selectors'
import { DashboardSummary } from './models/dashboard.model'
import { DashboardService } from './services/dashboard.service'
import { KpiCardsComponent } from './components/kpi-cards/kpi-cards.component'
import { SuppliesTrendChartComponent } from './components/charts/supplies-trend-chart/supplies-trend-chart.component'
import { SupplyDistributionChartComponent } from './components/charts/supply-distribution-chart/supply-distribution-chart.component'
import { UsersByRoleChartComponent } from './components/charts/users-by-role-chart/users-by-role-chart.component'
import { DiscountSummaryComponent } from './components/discount-summary/discount-summary.component'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    AvatarModule,
    KpiCardsComponent,
    SuppliesTrendChartComponent,
    SupplyDistributionChartComponent,
    UsersByRoleChartComponent,
    DiscountSummaryComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private store = inject(Store)
  private dashboardService = inject(DashboardService)

  user$ = this.store.select(selectUser)

  /** Fecha actual usada por el panel "Resumen del día" (formateada en la plantilla con `date` pipe). */
  readonly currentDate = new Date()

  readonly errorMessage = signal<string | null>(null)

  readonly summary$: Observable<DashboardSummary | null> = this.dashboardService.getSummary().pipe(
    tap(() => this.errorMessage.set(null)),
    catchError((error: Error) => {
      this.errorMessage.set(error.message)
      return of(null)
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  )

  getInitials(name: string, lastName: string): string {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }
}

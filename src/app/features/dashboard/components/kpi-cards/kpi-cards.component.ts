import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { KpiMetric } from '../../models/dashboard.model'

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './kpi-cards.component.html',
  styleUrl: './kpi-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardsComponent {
  @Input({ required: true }) kpis: KpiMetric[] = []
}


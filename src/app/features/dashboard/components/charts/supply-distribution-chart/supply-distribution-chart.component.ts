import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Color, NgxChartsModule, ScaleType } from '@swimlane/ngx-charts'
import { ChartPoint } from '../../../models/dashboard.model'

@Component({
  selector: 'app-supply-distribution-chart',
  standalone: true,
  imports: [NgxChartsModule],
  templateUrl: './supply-distribution-chart.component.html',
  styleUrl: './supply-distribution-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplyDistributionChartComponent {
  @Input({ required: true }) data: ChartPoint[] = []

  readonly colorScheme: Color = {
    name: 'supplyDistribution',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#6366F1', '#0EA5E9'],
  }
}
